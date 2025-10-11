#Requires -Version 7.5.2 -Modules PowerShellEditorServices.Commands

class TextDocument {
  hidden [string] $text
  hidden [int[]] $indexes
  [string] $eol = "`n"

  TextDocument([string]$text) {
    $this.text = $text
    if ($text.Contains("`r`n")) {
      $this.eol = "`r`n"
    }
    $index = 0
    $this.indexes = while ($index -ne -1) {
      $index
      $index = $text.IndexOfAny($this.eol, $index + $this.eol.Length)
    }
  }

  [Microsoft.Windows.PowerShell.ScriptAnalyzer.Position] positionAt([int]$offset) {
    if ($offset -lt 0) {
      throw 'offset must ge 0'
    }
    $line = 1
    for ($i = 0; $i -lt $this.indexes.Count; $i++) {
      if ($offset -lt $this.indexes[$i]) {
        break
      }
      $line++
    }
    return [Microsoft.Windows.PowerShell.ScriptAnalyzer.Position]::new($line, $offset - $this.indexes[$i - 1] + 1)
  }

  [int] offsetAt([Microsoft.Windows.PowerShell.ScriptAnalyzer.Position]$position) {
    $iter = $this.indexes.GetEnumerator()
    $line = $position.Line - 1
    do {
      $iter.MoveNext()
    } while ($line--)
    return $iter.Current + $position.Column - 1
  }

  [System.Tuple[int, int]] offsetsAt([Microsoft.Windows.PowerShell.ScriptAnalyzer.Range]$range) {
    $iter = $this.indexes.GetEnumerator()
    $line = $range.Start.Line - 1
    do {
      $iter.MoveNext()
    } while ($line--)
    $s = $iter.Current + $range.Start.Column - 1
    $line = $range.End.Line - $range.Start.Line
    while ($line--) {
      $iter.MoveNext()
    }
    return [System.Tuple[int, int]]::new($s, $iter.Current + $range.End.Column - 1)
  }

  [string] getText() {
    return $this.text
  }

  [string] getText([Microsoft.Windows.PowerShell.ScriptAnalyzer.Range]$range) {
    $offsets = $this.offsetsAt($range)
    return $this.text.Substring($offsets.Item1, $offsets.Item2 - $offsets.Item1)
  }
}
