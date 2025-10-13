using namespace System.Management.Automation
using namespace System.Management.Automation.Language
using namespace System.Collections.Generic

enum NodeType {
  Ast
  Token
  TokensChild
}

class AstNode {
  [string] $id = $Script:id++
  [int] $type = [NodeType]::Ast
  [string] $fieldName
  [string] $typeName
  [int[]] $range
  [Dictionary[string, System.Object]] $meta
  [TokensChildNode] $tokens
  [AstNode[]] $children
}

class TokenNode {
  [int] $type = [NodeType]::Token
  [int[]] $range
  [TokenKind] $Kind
  [TokenFlags] $TokenFlags
  [bool] $HasError
  TokenNode([Token]$token) {
    $this.range = getRange $token.Extent
    $this.Kind, $this.TokenFlags, $this.HasError = $token.Kind, $token.TokenFlags, $token.HasError
  }
}

class TokensChildNode {
  [string] $id = $Script:id++
  [int] $type = [NodeType]::TokensChild
  [int[]] $indexes
  TokensChildNode([int[]]$range, [TokenNode[]]$tokenNodes) {
    $this.indexes = @(0..($tokenNodes.Count - 1) | Where-Object { rangeContains $range $tokenNodes[$_].range })
  }
}

function getRange ([IScriptExtent]$Extent) {
  [int[]]@(
    $Extent.StartLineNumber - 1
    $Extent.StartColumnNumber - 1
    $Extent.EndLineNumber - 1
    $Extent.EndColumnNumber - 1
  )
}

function rangeContains ([int[]]$range, [int[]]$o) {
  ($range[0] -lt $o[0] -or ($range[0] -eq $o[0] -and $range[1] -le $o[1])) -and
  ($range[2] -gt $o[2] -or ($range[2] -eq $o[2] -and $range[3] -ge $o[3]))
}

function normalizeDynamicKeyword ([DynamicKeyword]$keyword) {
  # exclude [System.Func]
  $keyword | Select-Object -ExcludeProperty PreParse, PostParse, SemanticCheck
}

filter visitAst ([string]$fieldName, [psobject[]]$tokenNodes) {
  [Ast]$ast = $_
  [string]$typeName = $ast.GetType().Name
  [int[]]$range = getRange $ast.Extent
  [Dictionary[string, System.Object]]$meta = @{}
  [AstNode[]]$children = $ast.GetType().GetProperties() | Where-Object { $_.DeclaringType.IsSubclassOf([Ast]) } | ForEach-Object {
    $name = $_.Name
    $value = $ast.$name
    if (!$value) {
      $meta[$name] = $value
      return
    }
    $type = $_.PropertyType
    @(if ($type.IsArray) {
        $type = $type.GetElementType()
      }
      if ($type.IsAssignableTo([Ast])) {
        $value
      }
      elseif ($type.GetInterface('IReadOnlyCollection`1')) {
        $elementType = $type.GenericTypeArguments[0]
        if ($elementType.IsAssignableTo([Ast])) {
          $value
        }
        elseif ($elementType.GetInterface('ITuple') -and $elementType.GenericTypeArguments[0].IsAssignableTo([Ast])) {
          $value | ForEach-Object { $_[0..($_.Length - 1)] }
        }
        else {
          Write-Debug "unknown $typeName.$name $type : $value"
        }
      }
      else {
        $meta[$name] = switch ($type) {
          # StringConstantExpressionAst.Value -is [System.Object] but actually [string]
          { $type.IsEnum -or $type.IsValueType -or $ignoredPropTypes.Contains($_) -or $value -is [string] } { $value; break }
          ([type]) { $value.ToString(); break }
          ([Token]) { $value | Select-Object Kind, TokenFlags, HasError, @{Name = 'range'; Expression = { getRange $_.Extent } }; break }
          ([ITypeName]) { $value | Select-Object AssemblyName, FullName, IsArray, IsGeneric, Name, @{Name = 'range'; Expression = { getRange $_.Extent } }; break }
          ([IScriptExtent]) { $value | ForEach-Object { getRange $_ }; break }
          ([DynamicKeyword]) { $value | ForEach-Object { normalizeDynamicKeyword $_ }; break }
          default { Write-Debug "$typeName.meta.$name type: $type"; break }
        }
      }) | visitAst $name $tokenNodes
  }
  $ast.GetType().GetMethods() | Where-Object { $methodNames.Contains($_.Name) -and !$_.GetParameters() -and $_.DeclaringType.IsSubclassOf([Ast]) } | ForEach-Object {
    $meta.($_.Name + '()') = $ast.($_.Name)()
  }
  [AstNode]@{
    fieldName = $fieldName
    typeName  = $typeName
    range     = $range
    meta      = $meta
    tokens    = [TokensChildNode]::new($range, $tokenNodes)
    children  = $children ?? @()
  }
}

function Get-AstNode ([string]$ScriptInput) {
  [Token[]]$tokens = $null
  [ScriptBlockAst]$ast = [Parser]::ParseInput($ScriptInput, [ref]$tokens, [ref]$null)
  [TokenNode[]]$tokenNodes = $tokens.ForEach{ [TokenNode]::new($_) }
  @{
    root   = $ast | visitAst ScriptFile $tokenNodes
    tokens = $tokenNodes
  }
}

[type[]]$ignoredPropTypes = @([string], [VariablePath], [ScriptRequirements])
[string[]]$methodNames = @('GetHelpContent', 'IsConstantVariable')
[ulong]$id = 0
