import {
  commands,
  ThemeIcon,
  window,
  type Terminal,
  type TerminalOptions,
} from 'vscode'
import which from 'which'
import { isWin32, setTimeoutPm } from '.'
import { getExtConfig } from '../config'

export type TerminalRunLanguageIds =
  | 'bat'
  | 'shellscript'
  | 'powershell'
  | 'python'
  | 'javascript'
  | 'typescript'

export function getTerminalLaunchLanguageId(
  languageId: string,
): TerminalRunLanguageIds {
  switch (languageId) {
    case 'bat':
    case 'javascript':
    case 'powershell':
    case 'python':
    case 'shellscript':
    case 'typescript':
      return languageId
    case 'html':
    case 'javascriptreact':
    case 'json':
    case 'jsonc':
    case 'toml':
      return 'javascript'
    case 'mdx':
    case 'svelte':
    case 'typescriptreact':
    case 'vue':
      return 'typescript'
    default:
      return getExtConfig('terminalRunCode.defaultLanguageId')
  }
}

async function createLanguageTerminal(
  languageId: TerminalRunLanguageIds,
  options: Partial<TerminalOptions> = {},
) {
  const shellArgs = (
    getExtConfig('terminalLaunch.languageMap')[languageId] ?? 'pwsh'
  ).split(' ')
  return setTimeoutPm(
    300,
    window.createTerminal({
      name: languageId,
      isTransient: false,
      shellPath: await which(shellArgs.shift()!),
      shellArgs,
      ...options,
    }),
  )
}

async function createShellIntegratedTerminal(profileName: string) {
  await commands.executeCommand('workbench.action.terminal.newWithProfile', {
    profileName,
  })
  return new Promise<Terminal>((resolve, reject) => {
    const timeout = setTimeout(() => {
      event.dispose()
      reject(`create shell integrated ${profileName} terminal timeout`)
    }, 6000)
    const event = window.onDidChangeTerminalShellIntegration((e) => {
      if (e.terminal.name === profileName) {
        event.dispose()
        clearTimeout(timeout)
        resolve(e.terminal)
      }
    })
  })
}

async function createTerminal(languageId: TerminalRunLanguageIds) {
  switch (languageId) {
    case 'bat':
      if (!isWin32) {
        throw 'create (Command Prompt) not possible'
      }
      await commands.executeCommand(
        'workbench.action.terminal.newWithProfile',
        {
          profileName: 'Command Prompt',
        },
      )
      return setTimeoutPm(99, window.activeTerminal!)
    case 'shellscript':
      return createShellIntegratedTerminal(isWin32 ? 'Git Bash' : 'bash')
    case 'powershell':
      return createShellIntegratedTerminal(isWin32 ? 'PowerShell' : 'pwsh')
    case 'python':
      return createLanguageTerminal('python', {
        iconPath: new ThemeIcon('python'),
      })
    case 'javascript':
    case 'typescript':
      return createLanguageTerminal(languageId)
  }
}

/*
 * 'bash', 'cmd', 'csh', 'fish', 'gitbash', 'julia', 'ksh', 'node', 'nu', 'pwsh',
 * 'python','sh', 'wsl', 'zsh'.
 */
const shellToLanguageId = Object.freeze({
  bash: 'shellscript',
  cmd: 'bat',
  gitbash: 'shellscript',
  node: 'javascript',
  pwsh: 'powershell',
  python: 'python',
  wsl: 'shellscript',
})

export async function terminalRunCode(
  code: string,
  languageId: TerminalRunLanguageIds,
) {
  code = code.trim()
  languageId = getTerminalLaunchLanguageId(languageId)
  switch (languageId) {
    case 'shellscript':
    case 'powershell':
    case 'javascript':
      code = code.replaceAll('\r\n', '\n') + '\n'
      break
    case 'typescript':
      code = '.editor\n' + code.replaceAll('\r\n', '\n') + '\x04'
      break
    case 'python':
      // remove auto indent, close control scope
      code = code.replace(/\r?\n/g, '\n\u0015') + '\n\n\n'
      break
  }
  const terminal =
    window.terminals
      .concat(window.activeTerminal ?? [])
      .findLast(
        (t) =>
          shellToLanguageId[t.state.shell as 'pwsh'] === languageId ||
          t.name.toLowerCase().includes(languageId),
      ) ?? (await createTerminal(languageId))
  terminal.show()
  if (!terminal.shellIntegration) {
    terminal.sendText(code, false)
    return
  }
  let text = ''
  for await (const data of terminal.shellIntegration
    .executeCommand(code)
    .read()) {
    text += data
  }
  return text
}
