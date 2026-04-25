[CmdletBinding()]
param (
  [Parameter()]
  [switch]
  $SyncVSCodeVersion
)
Push-Location -LiteralPath $PSScriptRoot
trap { Pop-Location }
if ($SyncVSCodeVersion) {
  $version = jq '.devDependencies."@types/vscode"' ./package.json
  Convert-Path ./extensions/*/package.json | ForEach-Object { yq -i .engines.vscode=$version $_ }
}
Pop-Location
