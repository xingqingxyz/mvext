function rangeNew ([int[]]$range) {
  [Microsoft.Windows.PowerShell.ScriptAnalyzer.Range]::new($range[0] + 1, $range[1] + 1, $range[2] + 1, $range[3] + 1)
}

filter Show-AstNode ([int]$depth = 0) {
  if (!$_) {
    return
  }
  $root = $_
  @(
    $TAB * $depth
    $PSStyle.Bold
    $PSStyle.FormatHyperlink($root.type, ($document.getText((rangeNew $root.range)) | ConvertTo-Json))
    $PSStyle.Reset
    $TAB
    '[{0}, {1}] - [{2}, {3}]' -f @($root.range.ForEach{ $_ + 1 })
  ) -join ''
  $root.GetEnumerator().ForEach{
    if (!'meta range type tokens'.Contains($_.Key) -and $_.Value) {
      $TAB * $depth + $_.Key
      $_.Value | Show-AstNode ($depth + 1)
    }
  }
}

$ErrorActionPreference = 'Stop'
Import-Module $PSScriptRoot/VisitAst.psm1
$tree = VisitAst\Get-AstNode $ScriptInput
$TAB = '  '
$content = Get-Content -Raw -LiteralPath $PSScriptRoot/../fixtures/test.ps1
. $PSScriptRoot/ConvertTo-AstNode.ps1 $content
. $PSScriptRoot/TextDocument.ps1
$document = [TextDocument]::new($content)
$tree.root | Show-AstNode
