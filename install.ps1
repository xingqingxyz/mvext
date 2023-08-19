$ErrorActionPreference = 'Stop'

Remove-Item $PSScriptRoot\mvext-*.vsix -ErrorAction Continue
vsce.cmd package --yarn
($ext = (Get-Item $PSScriptRoot\mvext-*.vsix).FullName)
if (-not $ext) {
    return 1
}
code.cmd --install-extension $ext
