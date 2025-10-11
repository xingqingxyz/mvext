#Requires -Version 7.5.2
using namespace System.Management.Automation.Language

function Write-Log ([string]$msg) {
  "[$(Get-Date)] $msg" >> Temp:/mvext-powershell.log
}

function parseAst ([string]$ScriptInput) {
  $tokens = $null
  $ast = [Parser]::ParseInput($ScriptInput, [ref]$tokens, [ref]$null)
  [AstNodeVisitor]::new().GetNode($ast, $tokens) | ConvertTo-Json -Depth 99 -EnumsAsStrings -Compress | Tee-Object Temp:/mvext-powershell.json
}

$ErrorActionPreference = 'Stop'
. $PSScriptRoot/AstNodeVisitor.ps1
$buffer = [char[]]::new(1024)
while ($true) {
  $length = [int][System.Console]::ReadLine()
  Write-Log "Receiving Length $length"
  $tuple = [int]::DivRem($length, 1024)
  $text = @(
    for ([int]$i = 0; $i -lt $tuple.Item1; $i++) {
      [string]::new($buffer, 0, [System.Console]::In.Read($buffer, 0, 1024))
    }
    [string]::new($buffer, 0, [System.Console]::In.Read($buffer, 0, $tuple.Item2))
  ) -join ''
  $text = parseAst $text
  Write-Log "Sending Length $($text.Length)"
  [System.Console]::Write("$($text.Length)`n$text")
}
