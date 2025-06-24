import { EOL } from 'os'
import { setTimeout as setTimeoutPm } from 'timers/promises'
import {
  CodeLens,
  commands,
  languages,
  Position,
  Range,
  ThemeIcon,
  window,
  workspace,
  type CancellationToken,
  type CodeLensProvider,
  type Event,
  type ProviderResult,
  type Terminal,
  type TextDocument,
} from 'vscode'
import which from 'which'
import { getExtConfig } from './config'
import { isWin32 } from './util'

type MarkdownBlockRunLanguageIds =
  | 'bat'
  | 'shellscript'
  | 'powershell'
  | 'python'
  | 'javascript'
  | 'typescript'

export class MarkdownBlockRunProvider implements CodeLensProvider {
  static readonly reCodeBlockRange =
    /(?<=^\s*|\n\s*)```([^\n]*)\n(.*?)\n\s*```\s*(?:\n|$)/gs
  constructor() {
    languages.registerCodeLensProvider('markdown', this)
  }
  onDidChangeCodeLenses?: Event<void> | undefined
  provideCodeLenses(
    document: TextDocument,
    token: CancellationToken,
  ): ProviderResult<CodeLens[]> {
    const codelens: CodeLens[] = []
    for (const { index, 1: lang, 2: code } of document
      .getText()
      .matchAll(MarkdownBlockRunProvider.reCodeBlockRange)) {
      if (token.isCancellationRequested) {
        return
      }
      let langId
      switch (lang.trim().split(/\s/)[0]) {
        case 'bat':
        case 'cmd':
          langId = 'bat'
          break
        case 'sh':
        case 'bash':
        case 'shell':
          langId = 'shellscript'
          break
        case 'pwsh':
        case 'powershell':
          langId = 'powershell'
          break
        case 'py':
        case 'python':
          langId = 'python'
          break
        case 'js':
        case 'javascript':
          langId = 'javascript'
          break
        case 'jsx':
        case 'javascriptreact':
        case 'ts':
        case 'tsx':
        case 'typescript':
        case 'typescriptreact':
          langId = 'typescript'
          break
      }
      const position = new Position(document.positionAt(index).line, 0)
      const range = new Range(position, position)
      if (langId) {
        codelens.push(
          new CodeLens(range, {
            command: 'mvext.runCodeBlock',
            title: '$(run)Run Code',
            tooltip: `Run ${langId} block interactively`,
            arguments: [code, langId],
          }),
        )
      }
      codelens.push(
        new CodeLens(range, {
          command: 'mvext._copyCodeBlock',
          title: 'Copy',
          tooltip: 'Copy Text',
          arguments: [code],
        }),
      )
    }
    return codelens
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
      reject(new Error('create shell integrated terminal timeout'))
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

async function createTerminal(langId: MarkdownBlockRunLanguageIds) {
  switch (langId) {
    case 'bat':
      if (!isWin32) {
        throw new Error('cannot create cmd terminal on non windows platform')
      }
      return window.createTerminal({
        name: 'cmd',
        iconPath: new ThemeIcon('terminal-cmd'),
        shellPath: process.env.COMSPEC!,
        shellArgs: ['/D'],
        isTransient: false,
      })
    case 'shellscript':
      return createShellIntegratedTerminal(isWin32 ? 'Git Bash' : 'bash')
    case 'powershell':
      return createShellIntegratedTerminal(isWin32 ? 'PowerShell' : 'pwsh')
    case 'python': {
      if (
        workspace
          .getConfiguration('python')
          .get<boolean>('terminal.shellIntegration.enabled')
      ) {
        // fix python repl on pwsh not run
        return createShellIntegratedTerminal('python').then(
          (t) => (t.sendText(''), t),
        )
      }
      return window.createTerminal({
        name: 'python',
        iconPath: new ThemeIcon('python'),
        shellPath: await which('uv'),
        shellArgs: ['run', 'python'],
        isTransient: false,
      })
    }
    case 'javascript':
      return window.createTerminal({
        name: 'node',
        iconPath: new ThemeIcon('json'),
        shellPath: await which('node'),
        isTransient: false,
      })
    case 'typescript': {
      const terminal = window.createTerminal({
        name: 'tsx',
        iconPath: new ThemeIcon('console'),
        shellPath: await which('npx'),
        shellArgs: ['tsx'],
        isTransient: false,
      })
      // accept install
      terminal.sendText('')
      return setTimeoutPm(1000, terminal)
    }
  }
}

/*
 * 'bash', 'cmd', 'csh', 'fish', 'gitbash', 'julia', 'ksh', 'node', 'nu', 'pwsh',
 * 'python','sh', 'wsl', 'zsh'.
 */
const shellToLangId = Object.freeze({
  bash: 'shellscript',
  cmd: 'bat',
  gitbash: 'shellscript',
  node: 'javascript',
  pwsh: 'powershell',
  python: 'python',
  wsl: 'shellscript',
})

export async function runCodeBlock(
  code: string,
  langId: MarkdownBlockRunLanguageIds,
) {
  code = code.trim()
  switch (langId) {
    case 'shellscript':
    case 'powershell':
    case 'javascript':
      code = code.replaceAll('\r\n', '\n')
      break
    case 'typescript':
      // current tsx, esno and bun repl dosen't support types
      code = code.replaceAll('\r\n', '; ')
      break
    case 'python':
      // remove auto indent, close control scope
      code = code.replaceAll('\r\n', '\n' + '\u0015') + EOL.repeat(2)
      break
  }
  const terminal =
    window.terminals.find(
      // @ts-expect-error ignore undefined key
      (t) => shellToLangId[t.state.shell] === langId,
    ) ?? (await createTerminal(langId))
  terminal.show()
  if (!terminal.shellIntegration) {
    terminal.sendText(code)
    return
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      event.dispose()
      reject('shell execution timeout')
    }, getExtConfig('runCodeBlock.timeoutMs'))
    const execution = terminal.shellIntegration!.executeCommand(code)
    const event = window.onDidEndTerminalShellExecution((e) => {
      if (e.execution === execution) {
        event.dispose()
        clearTimeout(timer)
        resolve()
      }
    })
  })
}
