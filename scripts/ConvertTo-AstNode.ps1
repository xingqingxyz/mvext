#Requires -Version 7.5.2
using namespace System.Management.Automation.Language

[CmdletBinding()]
param (
  [Parameter(Mandatory, Position = 0)]
  [string]
  $ScriptInput
)

. $PSScriptRoot/../resources/AstNodeVisitor.ps1
$tokens = $null
$pe = $null
$ast = [Parser]::ParseInput($ScriptInput, [ref]$tokens, [ref]$pe)
$root = [AstNodeVisitor]::new().GetNode($ast, $tokens)
$root
