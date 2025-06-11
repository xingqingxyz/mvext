import { EOL } from 'os'
import {
  CodeLens,
  commands,
  Position,
  Range,
  ThemeIcon,
  window,
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

export class MarkdownBlockRunProvider implements CodeLensProvider {
  private static readonly reCodeBlockRange =
    /(?<=^\s*|\n\s*)```([^\n]*)\n(.*?)\n\s*```\s*(?:\n|$)/gs

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
        case 'ts':
        case 'typescript':
          langId = 'typescript'
          break
      }
      const position = new Position(document.positionAt(index).line, 0)
      const range = new Range(position, position)
      if (langId) {
        codelens.push(
          new CodeLens(range, {
            command: 'mvext.runCodeBlock',
            title: '$(play)Run Code',
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

async function createTerminal(
  langId: 'powershell' | 'shellscript' | 'python' | 'javascript' | 'typescript',
) {
  switch (langId) {
    case 'powershell': {
      await commands.executeCommand<Terminal>(
        'workbench.action.terminal.newWithProfile',
        { profileName: 'PowerShell' },
      )
      return new Promise<Terminal>((resolve, reject) => {
        const event = window.onDidChangeTerminalShellIntegration((e) => {
          if (e.terminal.name === 'pwsh') {
            event.dispose()
            resolve(e.terminal)
          }
        })
      })
    }
    case 'shellscript': {
      await commands.executeCommand<Terminal>(
        'workbench.action.terminal.newWithProfile',
        { profileName: isWin32 ? 'Git Bash' : 'bash' },
      )
      return new Promise<Terminal>((resolve, reject) => {
        const event = window.onDidChangeTerminalShellIntegration((e) => {
          if (e.terminal.name === 'bash') {
            event.dispose()
            resolve(e.terminal)
          }
        })
      })
    }
    case 'python':
      return window.createTerminal({
        name: 'python',
        iconPath: new ThemeIcon('python'),
        shellPath: await which('uv'),
        shellArgs: ['run', 'python'],
        isTransient: false,
      })
    case 'javascript':
      return window.createTerminal({
        name: 'node',
        iconPath: new ThemeIcon('json'),
        shellPath: await which('node'),
        isTransient: false,
      })
    case 'typescript':
      return window.createTerminal({
        name: 'tsx',
        iconPath: new ThemeIcon('console'),
        shellPath: await which('npx'),
        shellArgs: ['tsx'],
        isTransient: false,
      })
    default:
      throw 'not supported terminal: ' + langId
  }
}

export async function runCodeBlock(
  code: string,
  langId: 'powershell' | 'shellscript' | 'python' | 'javascript' | 'typescript',
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
  const reTerminalName =
    /(powershell|pwsh)|(bash|wsl)|(python)|(node)|(deno|bun|tsx)|.*/i
  const langIdMap = [
    'powershell',
    'shellscript',
    'python',
    'javascript',
    'typescript',
  ]
  const terminal =
    window.terminals.find(
      (t) =>
        langIdMap[t.name.match(reTerminalName)!.findLastIndex(Boolean) - 1] ===
        langId,
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
