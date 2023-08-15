$ErrorActionPreference = 'Stop'

Remove-Item $PSScriptRoot\mvext-*.vsix -ErrorAction Continue
vsce.cmd package
($ext = (Get-Item $PSScriptRoot\mvext-*.vsix).FullName)
try {
	code-insiders.cmd --install-extension $ext
}
catch {}
code.cmd --install-extension $ext
