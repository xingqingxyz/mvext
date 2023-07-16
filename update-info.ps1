$deps = (ConvertFrom-Json -InputObject "$(npm ls --json)").dependencies
$map = @{}
Get-Member -InputObject $deps -MemberType NoteProperty | ForEach-Object {
	$map.Add($_.Name , ($deps."$($_.Name)").version)
}
($json = ConvertTo-Json -InputObject $map)

npm pkg set devDependencies=$json