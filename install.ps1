$ErrorActionPreference = 'Stop'

# prepare
Remove-Item $PSScriptRoot\mvext-*.vsix -ErrorAction Ignore
# pack deps
vsce package --yarn
($extPath = (Get-Item $PSScriptRoot\mvext-*.vsix).FullName)
# install
code --install-extension $extPath
if (Get-Command code-insiders.cmd -ErrorAction Ignore) {
    code-insiders.cmd --install-extension $extPath
}
