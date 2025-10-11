#Requires -Version 7.5.2 -Modules Pester

$ErrorActionPreference = 'Stop'
$PSNativeCommandUseErrorActionPreference = $true

. $PSScriptRoot/TextDocument.ps1

BeforeAll {
  Write-Host 'hello world'
  notify-send 'hello pester'
}

BeforeAll {
  Write-Host ([TextDocument].FullName)
  $Global:document = [TextDocument]::new(@'
  hello,
  world
'@)
}

Describe '#offsetAt' {
  It 'must true offset' {
    $document.offsetAt([Microsoft.Windows.PowerShell.ScriptAnalyzer.Position]::new(1, 6)) | Should -Be 5
    $document.offsetAt([Microsoft.Windows.PowerShell.ScriptAnalyzer.Position]::new(2, 3)) | Should -Be 10
  }
}
