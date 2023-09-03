@echo off

setlocal ENABLEDELAYEDEXPANSION
set list={
for /F "usebackq" %%i in ("%~dp0\tokens.txt") do (
  echo %%i
  for /F "usebackq" %%j in (`where.exe %%i`) do (
    echo %%j
    set list=!list!"%%i": "%%j",
  )
)
echo !list!}>result.txt
endlocal

subl result.txt
