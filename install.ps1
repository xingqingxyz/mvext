$ErrorActionPreference = 'Stop'

# prepare
Remove-Item $PSScriptRoot\mvext-*.vsix -ErrorAction Ignore
# pack deps
vsce.cmd package --yarn
($extPath = (Get-Item $PSScriptRoot\mvext-*.vsix).FullName)
# install
code.cmd --install-extension $extPath
if (Get-Command code-insiders.cmd -ErrorAction Ignore) {
    code-insiders.cmd --install-extension $extPath
}
