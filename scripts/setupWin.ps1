Install-Script Install-VSCode
Install-VSCode.ps1 -Architecture '64-bit' -BuildEdition 'Stable-System' -EnableContextMenus -LaunchWhenDone

winget.exe import "$($PSScriptRoot)\winget-list.json"
$apps = @('Microsoft.VisualStudioCode',
	'Microsoft.WindowsTerminal',
	'vim.vim',
	'sharkdp.fd',
	'BurntSushi.ripgrep.MSVC',
	'Bandisoft.Bandizip',
	'voidtools.Everything')

($apps) | ForEach-Object {
	$_
	winget.exe install $_
}

$downloadDir = "$($env:TEMP)\MyApps\"
Invoke-WebRequest chocolately $downloadDir
