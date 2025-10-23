#Requires -Version 7.5.3 -Modules PowerShellEditorServices.Commands

[CmdletBinding()]
param (
  [Parameter(Mandatory)]
  [ValidateNotNullOrEmpty()]
  [string]
  $IpcPath
)

function newRandomName {
  [System.Random]::new().NextDouble().ToString('F6').Substring(2)
}

$ErrorActionPreference = 'Stop'
Add-Type -LiteralPath $PSScriptRoot/../VisitAst/bin/Release/net9.0/VisitAst.dll

PowerShellEditorServices.Commands\Register-EditorCommand -Name 'mvext.sendAstTreeJson' -DisplayName (newRandomName) -ScriptBlock {
  $fileContext = $psEditor.GetEditorContext().CurrentFile
  [VisitAst.AstNodeVisitor]::Visit($fileContext.Ast, $fileContext.Tokens) | ConvertTo-Json -Depth 99 -Compress > $IpcPath
}.GetNewClosure() -SuppressOutput

PowerShellEditorServices.Commands\Register-EditorCommand -Name 'mvext.provideCodeActions' -DisplayName (newRandomName) -ScriptBlock {
  $fileContext = $psEditor.GetEditorContext().CurrentFile
  [VisitAst.AstNodeVisitor]::Visit($fileContext.Ast, $fileContext.Tokens) | ConvertTo-Json -Depth 99 -Compress > $IpcPath
}.GetNewClosure() -SuppressOutput
