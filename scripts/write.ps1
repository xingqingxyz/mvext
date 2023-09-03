$allColors = @(
    'Blue',
    'Cyan',
    'DarkBlue',
    'DarkCyan',
    'DarkGray',
    'DarkGreen',
    'DarkMagenta',
    'DarkRed',
    'DarkYellow',
    'Gray',
    'Green',
    'Magenta',
    'Red',
    'White',
    'Yellow'
)

$random = [random]::new()
$reset = "`b" * 80
# $line = [string[]]::new(80)
# for ($i = 0; $i -lt 80; $i++) {
#     $line[$i] = ' '
# }

$nodeJob = node $PSScriptRoot\send.js &
Write-Verbose 'node passed'

for ($i = 39; $i -ge 0; $i--) {
    if (waitfor.exe 'NextTick') {
        Write-Host $reset -NoNewline
        Write-Host (' ' * $i) -NoNewline
        Write-Host -ForegroundColor $allColors[$random.Next(15)] '/' -NoNewline
        # $line[$i] = '/'
        # $line[79 - $i] = '\'
        for ($j = 78 - $i; $j -gt $i; $j--) {
            Write-Host -ForegroundColor $allColors[$random.Next(15)] $(switch ($random.Next(3)) {
                    0 { ' ' }
                    1 { '*' }
                    2 { '#' }
                }) -NoNewline
        }
        Write-Host -ForegroundColor $allColors[$random.Next(15)] '\' -NoNewline
        Write-Host (' ' * $i) -NoNewline

        # Write-Host ($line -join '') -ForegroundColor $allColors[$random.Next(15)] -NoNewline
    }
}
Write-Host -BackgroundColor Black ''

Start-Sleep -Milliseconds 300
if ($nodeJob.State -eq 'Completed') {
    Remove-Job $nodeJob
}
else {
    Write-Warning 'not stoped nodeJob'
    $nodeJob
}
