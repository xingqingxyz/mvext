Remove-Item $PSScriptRoot\my-extension-* -ErrorAction Continue
vsce.cmd package
if (!$?) {
  return
}
($ext = (Get-Item $PSScriptRoot\my-extension-*).FullName)
code-insiders.cmd --install-extension $ext
code.cmd --install-extension $ext
