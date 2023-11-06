#!/usr/bin/env pwsh
$ErrorActionPreference = 'Stop'

# prepare
Remove-Item $PSScriptRoot\mvext-*.vsix -ErrorAction Ignore
# pack deps
vsce package
($extPath = (Get-Item $PSScriptRoot\mvext-*.vsix).FullName)
# install
code --install-extension $extPath
if (Get-Command code-insiders -ErrorAction Ignore) {
    code-insiders --install-extension $extPath
}
