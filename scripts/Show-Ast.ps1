[CmdletBinding()]
param (
  [Parameter(Mandatory, Position = 0)]
  [string]
  $LiteralPath
)

function newRange ([int[]]$range) {
  [Microsoft.Windows.PowerShell.ScriptAnalyzer.Range]::new($range[0] + 1, $range[1] + 1, $range[2] + 1, $range[3] + 1)
}

$ErrorActionPreference = 'Stop'
. $PSScriptRoot/../resources/visitAst.ps1
Get-AstNode (Get-Content -Raw -LiteralPath $LiteralPath) | ConvertTo-Json -Depth 99 -Compress
