#Requires -Version 7.5.3

function Write-Log ([string]$msg) {
  "[$(Get-Date)] [Client] $msg" >> Temp:/mvext-powershell.log
}

$ErrorActionPreference = 'Stop'
Add-Type -LiteralPath $PSScriptRoot/../VisitAst/bin/Release/net9.0/VisitAst.dll
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
  $text = [VisitAst.AstNodeVisitor]::Visit($text) | ConvertTo-Json -Depth 99 -Compress | Tee-Object Temp:/mvext-powershell.json
  Write-Log "Sending Length $($text.Length)"
  [System.Console]::Write("$($text.Length)`n$text")
}
