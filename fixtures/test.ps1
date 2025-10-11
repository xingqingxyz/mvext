'[{0}, {1}] - [{2}, {3}]' -f @($root.range.ForEach{ $_ + 1 })
filter Show-AstNode ([int]$depth = 0) {
  if (!$_) {
    return
  }
  $root = $_
  @(
    $PSStyle.Bold
    $PSStyle.Reset
  ) -join ''
  $root.GetEnumerator().ForEach{
    $_.name
  }
}
