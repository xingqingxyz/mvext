using namespace System.Management.Automation.Language

$parentsMap = [ordered]@{}
[System.Management.Automation.CompletionCompleters]::CompleteType('System.Management.Automation.Language.') | Where-Object ListItemText -CLike *Ast | Sort-Object ListItemText | ForEach-Object {
  [type]$type = $_.CompletionText
  [string[]]$parentsMap[$_.ListItemText] = while ($type.BaseType.IsAssignableTo([Ast])) {
    $type = $type.BaseType
    $type.Name
  }
}
# .Ast -eq $null
$parentsMap.Ast = @()
$parentsMap | ConvertTo-Yaml > $PSScriptRoot/astParents.yml

$childrenMap = [ordered]@{}
foreach ($key in $parentsMap.Keys) {
  [string[]]$children = @()
  $parentsMap.GetEnumerator().ForEach{
    if ($_.Value[0] -ceq $key) {
      $children += $_.Key
    }
  }
  $childrenMap[$key] = $children
}
$childrenMap | ConvertTo-Yaml > $PSScriptRoot/astChildren.yml
