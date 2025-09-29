using namespace System.Management.Automation.Language

[CmdletBinding()]
param (
  [Parameter(Mandatory, Position = 0)]
  [string]
  $ScriptInput
)

function getRange ($Obj, [string]$Key = 'Extent') {
  [IScriptExtent]$e = $Obj.$Key
  $e.StartLineNumber - 1
  $e.StartColumnNumber - 1
  $e.EndLineNumber - 1
  $e.EndColumnNumber - 1
}

class TokenVisitor : AstVisitor2 {
  hidden [ordered] $nodeMap
  hidden [Token[]] $tokens
  TokenVisitor([Ast]$root, [Token[]]$tokens, [System.Collections.Specialized.OrderedDictionary]$nodeMap) {
    $this.nodeMap = $nodeMap
    $this.tokens = $tokens
    $root.Visit($this)
  }
  [AstVisitAction] DefaultVisit([Ast]$ast) {
    $s = $ast.Extent.StartOffset
    $this.nodeMap.$ast.tokens = $this.tokens.Where{ $ast.Extent.StartOffset -le $_.Extent.StartOffset -and $_.Extent.EndOffset -le $ast.Extent.EndOffset } | Select-Object Kind, TokenFlags, HasError, @{Name = 'range'; Expression = { getRange $_ } }, @{Name = 'textOffsets'; Expression = { $_.Extent.StartOffset - $s, $_.Extent.EndOffset - $s } }
    return [AstVisitAction]::Continue
  }
}

class NodeAstVisitor : AstVisitor2 {
  hidden [ordered] $nodeMap
  [hashtable] GetNode([Ast]$root, [Token[]]$tokens) {
    $this.nodeMap = [ordered]@{}
    $root.Visit($this)
    [TokenVisitor]::new($root, $this.nodeMap, $tokens)
    foreach ($node in $this.nodeMap.Values) {
      foreach ($key in @($node.Keys)) {
        if ('meta range typeName tokens'.Contains($key)) {
          continue
        }
        $node.$key = @(foreach ($ast in $node.$key) {
            $n = $this.nodeMap.$ast
            if ($n) { $n } else {
              "$($ast.GetType().Name) $ast"
              Write-Debug "node not found for: $ast on $($node.typeName)"
            }
          })
      }
    }
    return $this.nodeMap.$root
  }
  [AstVisitAction] DefaultVisit([Ast]$ast) {
    Write-Host "not catched $($ast.GetType().Name) $ast"
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitTypeDefinition([TypeDefinitionAst]$ast) {
    $this.nodeMap.$ast = @{
      Attributes = $ast.Attributes
      BaseTypes  = $ast.BaseTypes
      Members    = $ast.Members
      typeName   = $ast.GetType().Name
      range      = getRange $ast
      meta       = $ast | Select-Object Name, TypeAttributes
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitPropertyMember([PropertyMemberAst]$ast) {
    $this.nodeMap.$ast = @{
      Attributes   = $ast.Attributes
      InitialValue = $ast.InitialValue
      PropertyType = $ast.PropertyType
      typeName     = $ast.GetType().Name
      range        = getRange $ast
      meta         = $ast | Select-Object Name, PropertyAttributes
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitFunctionMember([FunctionMemberAst]$ast) {
    $this.nodeMap.$ast = @{
      Attributes = $ast.Attributes
      Body       = $ast.Body
      Parameters = $ast.Parameters
      ReturnType = $ast.ReturnType
      typeName   = $ast.GetType().Name
      range      = getRange $ast
      meta       = $ast | Select-Object MethodAttributes, Name
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitBaseCtorInvokeMemberExpression([BaseCtorInvokeMemberExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      Arguments  = $ast.Arguments
      Expression = $ast.Expression
      Member     = $ast.Member
      typeName   = $ast.GetType().Name
      range      = getRange $ast
      meta       = $ast | Select-Object @{Name = 'GenericTypeArguments'; Expression = { $_.GenericTypeArguments.FullName } }, NullConditional, Static, @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitUsingStatement([UsingStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Alias               = $ast.Alias
      ModuleSpecification = $ast.ModuleSpecification
      typeName            = $ast.GetType().Name
      range               = getRange $ast
      meta                = $ast | Select-Object UsingStatementKind
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitConfigurationDefinition([ConfigurationDefinitionAst]$ast) {
    $this.nodeMap.$ast = @{
      Body         = $ast.Body
      InstanceName = $ast.InstanceName
      typeName     = $ast.GetType().Name
      range        = getRange $ast
      meta         = $ast | Select-Object ConfigurationType
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitDynamicKeywordStatement([DynamicKeywordStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      CommandElements = $ast.CommandElements
      typeName        = $ast.GetType().Name
      range           = getRange $ast
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitTernaryExpression([TernaryExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      Condition = $ast.Condition
      IfFalse   = $ast.IfFalse
      IfTrue    = $ast.IfTrue
      typeName  = $ast.GetType().Name
      range     = getRange $ast
      meta      = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitPipelineChain([PipelineChainAst]$ast) {
    $this.nodeMap.$ast = @{
      LhsPipelineChain = $ast.LhsPipelineChain
      RhsPipeline      = $ast.RhsPipeline
      PureExpression   = $ast.GetPureExpression()
      typeName         = $ast.GetType().Name
      range            = getRange $ast
      meta             = $ast | Select-Object Background, Operator
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitErrorStatement([ErrorStatementAst]$ast) {
    Write-Warning "error statement reached $ast"
    $this.nodeMap.$ast = @{
      Bodies     = $ast.Bodies
      Conditions = $ast.Conditions
      NestedAst  = $ast.NestedAst
      typeName   = $ast.GetType().Name
      range      = getRange $ast
      meta       = $ast | Select-Object Flags, Kind
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitErrorExpression([ErrorExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      NestedAst = $ast.NestedAst
      typeName  = $ast.GetType().Name
      range     = getRange $ast
      meta      = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitScriptBlock([ScriptBlockAst]$ast) {
    $this.nodeMap.$ast = @{
      Attributes        = $ast.Attributes
      BeginBlock        = $ast.BeginBlock
      CleanBlock        = $ast.CleanBlock
      DynamicParamBlock = $ast.DynamicParamBlock
      EndBlock          = $ast.EndBlock
      HelpContent       = $ast.GetHelpContent()
      ParamBlock        = $ast.ParamBlock
      ProcessBlock      = $ast.ProcessBlock
      UsingStatements   = $ast.UsingStatements
      typeName          = $ast.GetType().Name
      range             = getRange $ast
      meta              = $ast | Select-Object ScriptRequirements
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitParamBlock([ParamBlockAst]$ast) {
    $this.nodeMap.$ast = @{
      Attributes = $ast.Attributes
      Parameters = $ast.Parameters
      typeName   = $ast.GetType().Name
      range      = getRange $ast
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitNamedBlock([NamedBlockAst]$ast) {
    $this.nodeMap.$ast = @{
      Statements = $ast.Statements
      Traps      = $ast.Traps
      typeName   = $ast.GetType().Name
      range      = getRange $ast
      meta       = $ast | Select-Object BlockKind, Unnamed
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitTypeConstraint([TypeConstraintAst]$ast) {
    $this.nodeMap.$ast = @{
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object @{Name = 'TypeName'; Expression = { $_.TypeName.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitAttribute([AttributeAst]$ast) {
    $this.nodeMap.$ast = @{
      NamedArguments      = $ast.NamedArguments
      PositionalArguments = $ast.PositionalArguments
      typeName            = $ast.GetType().Name
      range               = getRange $ast
      meta                = $ast | Select-Object @{Name = 'TypeName'; Expression = { $_.TypeName.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitParameter([ParameterAst]$ast) {
    $this.nodeMap.$ast = @{
      Attributes   = $ast.Attributes
      DefaultValue = $ast.DefaultValue
      Name         = $ast.Name
      typeName     = $ast.GetType().Name
      range        = getRange $ast
      meta         = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitTypeExpression([TypeExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }, @{Name = 'TypeName'; Expression = { $_.TypeName.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitFunctionDefinition([FunctionDefinitionAst]$ast) {
    $this.nodeMap.$ast = @{
      HelpContent = $ast.GetHelpContent()
      Statements  = $ast.Statements
      Traps       = $ast.Traps
      typeName    = $ast.GetType().Name
      range       = getRange $ast
      meta        = $ast | Select-Object IsFilter, IsWorkflow, Name
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitStatementBlock([StatementBlockAst]$ast) {
    $this.nodeMap.$ast = @{
      Statements = $ast.Statements
      Traps      = $ast.Traps
      typeName   = $ast.GetType().Name
      range      = getRange $ast
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitIfStatement([IfStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Clauses    = $ast.Clauses.ForEach{ $_.Item1; $_.Item2 }
      ElseClause = $ast.ElseClause
      typeName   = $ast.GetType().Name
      range      = getRange $ast
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitTrap([TrapStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Body     = $ast.Body
      TrapType = $ast.TrapType
      typeName = $ast.GetType().Name
      range    = getRange $ast
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitSwitchStatement([SwitchStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Clauses   = $ast.Clauses.ForEach{ $_.Item1; $_.Item2 }
      Condition = $ast.Condition
      Default   = $ast.Default
      typeName  = $ast.GetType().Name
      range     = getRange $ast
      meta      = $ast | Select-Object Flags, Label
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitDataStatement([DataStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Body            = $ast.Body
      CommandsAllowed = $ast.CommandsAllowed
      typeName        = $ast.GetType().Name
      range           = getRange $ast
      meta            = $ast | Select-Object Variable
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitForEachStatement([ForEachStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Body          = $ast.Body
      Condition     = $ast.Condition
      ThrottleLimit = $ast.ThrottleLimit
      Variable      = $ast.Variable
      typeName      = $ast.GetType().Name
      range         = getRange $ast
      meta          = $ast | Select-Object Flags, Label
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitDoWhileStatement([DoWhileStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Body      = $ast.Body
      Condition = $ast.Condition
      typeName  = $ast.GetType().Name
      range     = getRange $ast
      meta      = $ast | Select-Object Label
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitForStatement([ForStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Body        = $ast.Body
      Condition   = $ast.Condition
      Initializer = $ast.Initializer
      Iterator    = $ast.Iterator
      typeName    = $ast.GetType().Name
      range       = getRange $ast
      meta        = $ast | Select-Object Label
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitWhileStatement([WhileStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Body      = $ast.Body
      Condition = $ast.Condition
      typeName  = $ast.GetType().Name
      range     = getRange $ast
      meta      = $ast | Select-Object Label
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitCatchClause([CatchClauseAst]$ast) {
    $this.nodeMap.$ast = @{
      Body       = $ast.Body
      CatchTypes = $ast.CatchTypes
      typeName   = $ast.GetType().Name
      range      = getRange $ast
      meta       = $ast | Select-Object IsCatchAll
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitTryStatement([TryStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Body         = $ast.Body
      CatchClauses = $ast.CatchClauses
      Finally      = $ast.Finally
      typeName     = $ast.GetType().Name
      range        = getRange $ast
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitBreakStatement([BreakStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object Label
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitContinueStatement([ContinueStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object Label
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitReturnStatement([ReturnStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Pipeline = $ast.Pipeline
      typeName = $ast.GetType().Name
      range    = getRange $ast
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitExitStatement([ExitStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Pipeline = $ast.Pipeline
      typeName = $ast.GetType().Name
      range    = getRange $ast
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitThrowStatement([ThrowStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Pipeline = $ast.Pipeline
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object IsRethrow
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitDoUntilStatement([DoUntilStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Body      = $ast.Body
      Condition = $ast.Condition
      typeName  = $ast.GetType().Name
      range     = getRange $ast
      meta      = $ast | Select-Object Label
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitAssignmentStatement([AssignmentStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Left              = $ast.Left
      Right             = $ast.Right
      AssignmentTargets = $ast.GetAssignmentTargets()
      PureExpression    = $ast.GetPureExpression()
      typeName          = $ast.GetType().Name
      range             = getRange $ast
      meta              = $ast | Select-Object @{Name = 'ErrorPosition'; Expression = { getRange $_ @{Name = 'ErrorPosition'; Expression = { getRange $_ ErrorPosition } } } }, Operator
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitPipeline([PipelineAst]$ast) {
    $this.nodeMap.$ast = @{
      PipelineElements = $ast.PipelineElements
      PureExpression   = $ast.GetPureExpression()
      typeName         = $ast.GetType().Name
      range            = getRange $ast
      meta             = $ast | Select-Object Background
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitCommand([CommandAst]$ast) {
    $this.nodeMap.$ast = @{
      CommandElements = $ast.CommandElements
      Redirections    = $ast.Redirections
      typeName        = $ast.GetType().Name
      range           = getRange $ast
      meta            = $ast | Select-Object @{Name = 'CommandName'; Expression = { $ast.GetCommandName() } }, @{Name = 'DefiningKeyword'; Expression = { $_.DefiningKeyword.Keyword } }, InvocationOperator
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitCommandExpression([CommandExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      Expression   = $ast.Expression
      Redirections = $ast.Redirections
      typeName     = $ast.GetType().Name
      range        = getRange $ast
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitCommandParameter([CommandParameterAst]$ast) {
    $this.nodeMap.$ast = @{
      Argument = $ast.Argument
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object @{Name = 'ErrorPosition'; Expression = { getRange $_ ErrorPosition } }, ParameterName
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitMergingRedirection([MergingRedirectionAst]$ast) {
    $this.nodeMap.$ast = @{
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object FromStream, ToStream
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitFileRedirection([FileRedirectionAst]$ast) {
    $this.nodeMap.$ast = @{
      Location = $ast.Location
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object Append, FromStream
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitBinaryExpression([BinaryExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      Left     = $ast.Left
      Right    = $ast.Right
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object @{Name = 'ErrorPosition'; Expression = { getRange $_ ErrorPosition } }, Operator, @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitUnaryExpression([UnaryExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      Child    = $ast.Child
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }, TokenKind
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitConvertExpression([ConvertExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      Attribute = $ast.Attribute
      Child     = $ast.Child
      Type      = $ast.Type
      typeName  = $ast.GetType().Name
      range     = getRange $ast
      meta      = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitConstantExpression([ConstantExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }, Value
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitStringConstantExpression([StringConstantExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }, StringConstantType, Value
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitSubExpression([SubExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      SubExpression = $ast.SubExpression
      typeName      = $ast.GetType().Name
      range         = getRange $ast
      meta          = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitUsingExpression([UsingExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      SubExpression = $ast.SubExpression
      typeName      = $ast.GetType().Name
      range         = getRange $ast
      meta          = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitVariableExpression([VariableExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object Splatted, @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }, VariablePath, @{Name = 'IsConstantVariable'; Expression = { $ast.IsConstantVariable() } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitMemberExpression([MemberExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      Expression = $ast.Expression
      Member     = $ast.Member
      typeName   = $ast.GetType().Name
      range      = getRange $ast
      meta       = $ast | Select-Object NullConditional, Static, @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitInvokeMemberExpression([InvokeMemberExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      Arguments  = $ast.Arguments
      Expression = $ast.Expression
      Member     = $ast.Member
      typeName   = $ast.GetType().Name
      range      = getRange $ast
      meta       = $ast | Select-Object @{Name = 'GenericTypeArguments'; Expression = { $_.GenericTypeArguments.FullName } }, NullConditional, Static, @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitArrayExpression([ArrayExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      SubExpression = $ast.SubExpression
      typeName      = $ast.GetType().Name
      range         = getRange $ast
      meta          = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitArrayLiteral([ArrayLiteralAst]$ast) {
    $this.nodeMap.$ast = @{
      Elements = $ast.Elements
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitHashtable([HashtableAst]$ast) {
    $this.nodeMap.$ast = @{
      KeyValuePairs = $ast.KeyValuePairs.ForEach{ $_.Item1; $_.Item2 }
      typeName      = $ast.GetType().Name
      range         = getRange $ast
      meta          = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitScriptBlockExpression([ScriptBlockExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      ScriptBlock = $ast.ScriptBlock
      typeName    = $ast.GetType().Name
      range       = getRange $ast
      meta        = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitParenExpression([ParenExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      Pipeline = $ast.Pipeline
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitExpandableStringExpression([ExpandableStringExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      NestedExpressions = $ast.NestedExpressions
      typeName          = $ast.GetType().Name
      range             = getRange $ast
      meta              = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }, Value
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitIndexExpression([IndexExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      Index    = $ast.Index
      Target   = $ast.Target
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object NullConditional, @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitAttributedExpression([AttributedExpressionAst]$ast) {
    $this.nodeMap.$ast = @{
      Attribute = $ast.Attribute
      Child     = $ast.Child
      typeName  = $ast.GetType().Name
      range     = getRange $ast
      meta      = $ast | Select-Object @{Name = 'StaticType'; Expression = { $_.StaticType.FullName } }
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitBlockStatement([BlockStatementAst]$ast) {
    $this.nodeMap.$ast = @{
      Body     = $ast.Body
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object Kind
    }
    return [AstVisitAction]::Continue
  }
  [AstVisitAction] VisitNamedAttributeArgument([NamedAttributeArgumentAst]$ast) {
    $this.nodeMap.$ast = @{
      Argument = $ast.Argument
      typeName = $ast.GetType().Name
      range    = getRange $ast
      meta     = $ast | Select-Object ArgumentName, ExpressionOmitted
    }
    return [AstVisitAction]::Continue
  }
}

$tokens = $null
$pe = $null
$ast = [Parser]::ParseInput($ScriptContent, [ref]$tokens, [ref]$pe)
[NodeAstVisitor]::new().GetNode($ast, $tokens)
