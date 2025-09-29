using namespace System.Management.Automation
using namespace System.Management.Automation.Language

function displayNode ([Ast]$ast) {
  $ast | Format-Custom -Depth 1
}

function unpackParentheses ([ParenExpressionAst]$ast) {
  do {
    $ast = $ast.Pipeline.GetPureExpression()
  } while ($ast.GetType() -eq [ParenExpressionAst])
  $ast
}

function doWhileToWhile ([DoWhileStatementAst]$ast) {
  "$($ast.Label)while ($($ast.Condition)) $($ast.Body)"
}

function whileToDoWhile ([WhileStatementAst]$ast) {
  "$($ast.Label)do $($ast.Body) while ($($ast.Condition))"
}

[Token[]]$tokens = $null
[ParseError[]]$errors = $null
[ScriptBlockAst]$root = [Parser]::ParseFile('./test.1.ps1', [ref]$tokens, [ref]$errors)

$code = @'
& ls -l | Out-Default &
'@
[ScriptBlockAst]$root = [Parser]::ParseInput($code, [ref]$tokens, [ref]$errors)

[ParenExpressionAst]$node = (($root.EndBlock.Statements[0] -as [PipelineAst]).PipelineElements[0] -as [CommandExpressionAst]).Expression

$newNode = unpackParentheses $node
displayNode $newNode
