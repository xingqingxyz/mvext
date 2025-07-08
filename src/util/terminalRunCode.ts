/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { setTimeout as setTimeoutPm } from 'timers/promises'
import {
  commands,
  extensions,
  ThemeIcon,
  window,
  workspace,
  type Terminal,
  type TerminalOptions,
} from 'vscode'
import { isWin32 } from '.'
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

async function createShellIntegratedTerminal(profileName: string) {
  await commands.executeCommand(
    profileName === 'python'
      ? 'python.startREPL'
      : 'workbench.action.terminal.newWithProfile',
    {
      profileName,
    },
  )
  return new Promise<Terminal>((resolve, reject) => {
    const timeout = setTimeout(() => {
      event.dispose()
      reject('create shell integrated terminal timeout')
    }, 30000)
    const event = window.onDidChangeTerminalShellIntegration((e) => {
      if (e.terminal.name === profileName) {
        event.dispose()
        clearTimeout(timeout)
        resolve(e.terminal)
      }
    })
  })
}

function getTerminalCommand(
  languageId: TerminalRunLanguageIds,
): Pick<TerminalOptions, 'shellPath' | 'shellArgs'> {
  const shellPath = isWin32 ? process.env.COMSPEC! : '/bin/sh'
  let config = getExtConfig('terminalLaunch.languages')[languageId]
  switch (languageId) {
    case 'python':
      config ??= 'uv run python'
      return {
        shellPath,
        shellArgs: isWin32 ? '/D /C ' + config : ['-c', config],
      }
    case 'javascript':
      config ??= 'node'
      return {
        shellPath,
        shellArgs: isWin32 ? '/D /C ' + config : ['-c', config],
      }
    case 'typescript':
      config ??= 'bun x tsx'
      return {
        shellPath,
        shellArgs: isWin32 ? '/D /C ' + config : ['-c', config],
      }
    default:
      throw 'not implemented'
  }
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
      return window.activeTerminal!
    case 'shellscript':
      return createShellIntegratedTerminal(isWin32 ? 'Git Bash' : 'bash')
    case 'powershell':
      return createShellIntegratedTerminal(isWin32 ? 'PowerShell' : 'pwsh')
    case 'python': {
      if (
        extensions.getExtension('ms-python.python') &&
        workspace
          .getConfiguration('python')
          .get<boolean>('terminal.shellIntegration.enabled')
      ) {
        return createShellIntegratedTerminal('python')
      }
      return window.createTerminal({
        name: languageId,
        iconPath: new ThemeIcon('python'),
        isTransient: false,
        ...getTerminalCommand('python'),
      })
    }
    case 'javascript':
      return window.createTerminal({
        name: languageId,
        iconPath: new ThemeIcon('console'),
        isTransient: false,
        ...getTerminalCommand('javascript'),
      })
    case 'typescript': {
      const terminal = window.createTerminal({
        name: languageId,
        iconPath: new ThemeIcon('console'),
        isTransient: false,
        ...getTerminalCommand('typescript'),
      })
      return setTimeoutPm(1000, terminal)
    }
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
        // @ts-expect-error ignore undefined key
        shellToLanguageId[t.state.shell] === languageId ||
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
