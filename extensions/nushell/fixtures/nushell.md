# Nushell Code in Markdown

- config.nu

```nushell
const NU_LIB_DIRS = [
    (path self | path expand | path dirname)
]

source completion.nu
source keybindings.nu
source prompt.nu
source z.nu

$env.config.completions.algorithm = 'fuzzy'
$env.config.show_banner = false
$env.config.menus ++= [
    {
        name: history_menu
        only_buffer_difference: false
        marker: "? "
        type: {
            layout: list
            page_size: 10
        }
        style: {
            text: green
            selected_text: green_reverse
            description_text: yellow
        }
    }
]
```

- prompt.nu

```nu
$env.PROMPT_COMMAND = {
    let ec = if $env.LAST_EXIT_CODE > 0 { ansi red } else { ansi green }
    let hist = (history | last | default { index: 0 }).index + 1
    let ms = $env.CMD_DURATION_MS | into int
    let dur = if $ms <= 1 {
        [(ansi green), '<1ms']
    } else if $ms < 1000 {
        [(ansi cyan), $"($ms)ms"]
    } else if $ms < 60_000 {
        [(ansi blue), $"($ms / 1000)s"]
    } else if $ms < 3_600_000 {
        [(ansi yellow), $"($ms // 60_000)m($ms // 1000 mod 60)s"]
    } else if $ms < 86_400_000 {
        [(ansi magenta), $"($ms // 3_600_000)h($ms // 60_000 mod 60)m"]
    } else {
        [(ansi red), $"($ms // 86_400_000)d($ms // 3_600_000 mod 24)h"]
    }
    let dir = match (try { $env.PWD | path relative-to $nu.home-dir }) {
        null => $env.PWD
        '' => '~'
        $relative_pwd => ([~ $relative_pwd] | path join)
    }
    let dir = if 'WSL_DISTRO_NAME' in $env {
        $"file:///(wslpath -m $env.PWD)"
    } else if $nu.os-info.name == 'windows' {
        $"file:///($env.PWD | str replace --all \ /)"
    } else {
        $"file://($env.PWD)"
    } | ansi link --text $dir
    $"($ec)($env.LAST_EXIT_CODE)(ansi reset) \(($hist):($dur.0)($dur.1)(ansi reset)\) ($dir)"
}
$env.PROMPT_COMMAND_RIGHT = ''
```
