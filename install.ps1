Remove-Item $PSScriptRoot\mvext-*.vsix -ErrorAction Continue
vsce.cmd package
if (!$?) {
	return
}
($ext = (Get-Item $PSScriptRoot\mvext-*.vsix).FullName)
code-insiders.cmd --install-extension $ext
code.cmd --install-extension $ext
