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

export function getTerminalRunLanguageId(
  languageId: string,
): TerminalRunLanguageIds {
  switch (languageId) {
    case 'bat':
    case 'shellscript':
    case 'powershell':
    case 'python':
    case 'javascript':
    case 'typescript':
      return languageId
    case 'html':
    case 'json':
    case 'jsonc':
    case 'toml':
      return 'javascript'
    case 'mdx':
    case 'vue':
    case 'svelte':
      return 'typescript'
    default:
      return getExtConfig('terminalRunCode.defaultLanguageId')
  }
}

async function getTerminalCommand(
  languageId: TerminalRunLanguageIds,
): Promise<Pick<TerminalOptions, 'shellPath' | 'shellArgs'>> {
  let config = getExtConfig('terminalLaunch.languageMap')[languageId]
  switch (languageId) {
    case 'python':
      config ??= 'uv run python'
      break
    case 'javascript':
      config ??= 'node'
      break
    case 'typescript':
      config ??= 'bun x tsx'
      break
    default:
      throw 'not implemented'
  }
  const shellArgs = config.split(' ')
  return {
    shellPath: await which(shellArgs.shift()!),
    shellArgs,
  }
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
      return setTimeoutPm(90, window.activeTerminal!)
    case 'shellscript':
      return createShellIntegratedTerminal(isWin32 ? 'Git Bash' : 'bash')
    case 'powershell':
      return createShellIntegratedTerminal(isWin32 ? 'PowerShell' : 'pwsh')
    case 'python':
      return setTimeoutPm(
        300,
        window.createTerminal({
          name: languageId,
          iconPath: new ThemeIcon('python'),
          isTransient: false,
          ...(await getTerminalCommand(languageId)),
        }),
      )
    case 'javascript':
      return setTimeoutPm(
        300,
        window.createTerminal({
          name: languageId,
          isTransient: false,
          ...(await getTerminalCommand(languageId)),
        }),
      )
    case 'typescript':
      return setTimeoutPm(
        780,
        window.createTerminal({
          name: languageId,
          isTransient: false,
          ...(await getTerminalCommand(languageId)),
        }),
      )
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
    window.terminals.find(
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
