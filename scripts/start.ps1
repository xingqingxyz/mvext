$ErrorActionPreference = 'Stop'
Start-Process "$($PSScriptRoot)\setupWin.ps1"

# dir
$x = 'd:/Projects'
mkdir $x -Force && Set-Location $x
# proj
$x = 'hello'
git clone "https://github.com/xingqingxyz/$($x).git"
Set-Location $x
# pcm
$x = 'pnpm'
Invoke-Expression "$x install"

code .
