using namespace System.Management.Automation
using namespace System.Management.Automation.Language
using namespace System.Collections.Generic

[ulong]$id = 0

function getRange ([IScriptExtent]$Extent) {
  [int[]]@(
    $Extent.StartLineNumber - 1
    $Extent.StartColumnNumber - 1
    $Extent.EndLineNumber - 1
    $Extent.EndColumnNumber - 1
  )
}

function newAstNode ([Ast]$ast, [psobject[]]$Children, [string]$FieldName, [hashtable]$Meta) {
  [psobject]@{
    Id        = $Script:id++ -as [string]
    Children  = $Children
    FieldName = $FieldName
    Meta      = $Meta
    Range     = getRange $ast.Extent
    TypeName  = $ast.GetType().Name
  }
}

function normalizeToken ([Token]$token) {
  [psobject]@{
    HasError   = $token.HasError
    Kind       = $token.Kind.ToString()
    Range      = getRange $token.Extent
    TokenFlags = $token.TokenFlags.ToString()
  }
}

function normalizeDynamicKeyword ([DynamicKeyword]$keyword) {
  $keyword | Select-Object -ExcludeProperty PreParse, PostParse, SemanticCheck
}

function visitAst ([string]$fieldName, [Ast]$ast) {
  [psobject[]]$children = @()
  [hashtable]$meta = @{}
  $ast.GetType().GetProperties() | Where-Object { $_.DeclaringType.IsSubclassOf([Ast]) } | ForEach-Object {
    $name = $_.Name
    $value = $_.GetValue($ast)
    if ($null -eq $value) {
      $meta[$name] = $value
      return
    }
    if ($value -is [Ast]) {
      $children += visitAst $name $value
      return
    }
    if ($value -is [IReadOnlyCollection[Ast]]) {
      if ($value.Count -eq 0) {
        $meta[$name] = $value
        return
      }
      [int]$i = 0
      $children += $value | ForEach-Object { visitAst "$name[$i]" $_; $i++ }
      return
    }
    if ($value -is [IReadOnlyCollection[System.Runtime.CompilerServices.ITuple]] -and
      $_.PropertyType.GenericTypeArguments[0].GenericTypeArguments[0].IsAssignableTo([Ast])) {
      if ($value.Count -eq 0) {
        $meta[$name] = $value
        return
      }
      [int]$i = 0
      $children += $value | ForEach-Object { $_[0..($_.Length - 1)] } | ForEach-Object { visitAst "$name[$i]" $_; $i++ }
      return
    }
    $meta[$name] = switch ($true) {
      ($value -is [System.Enum] -or $value -is [type]) { $value.ToString(); break }
      ($value -is [System.ValueType] -or $value -is [string] -or $value -is [VariablePath] -or $value -is [ScriptRequirements]) { $value; break }
      ($value -is [DynamicKeyword]) { normalizeDynamicKeyword $value; break }
      ($value -is [Token]) { normalizeToken $value; break }
      ($value -is [IScriptExtent]) { getRange $value; break }
      ($value -is [ITypeName]) { $value | Select-Object AssemblyName, FullName, IsArray, IsGeneric, Name, @{Name = 'Range'; Expression = { getRange $_.Extent } }; break }
      default { $value.ToString(); break }
    }
  }
  $ast.GetType().GetMethods() | Where-Object { ($_.Name -ceq 'GetHelpContent' -or $_.Name -ceq 'IsConstantVariable') -and
    $_.GetParameters().Count -eq 0 -and $_.DeclaringType.IsSubclassOf([Ast]) } | ForEach-Object {
    $meta["$($_.Name)()"] = $_.Invoke($ast, $null)
  }
  newAstNode -ast $ast -Children $children -FieldName $fieldName -Meta $meta
}

function visit ([string]$text) {
  [ScriptBlockAst]$ast = [Parser]::ParseInput($text, [ref]$tokens, [ref]$null)
  [psobject]@{
    Root   = visitAst ScriptFile $ast
    Tokens = $tokens.ForEach{ normalizeToken $_ }
  }
}
