import vscode from 'vscode'
import { getExtConfig } from './utils/getExtConfig'

export function registerExperimental(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'mvext.experimentalEvalByShellIntegration',
      experimentalEvalByShellIntegration,
    ),
  )
}

export async function experimentalEvalByShellIntegration() {
  const editor = vscode.window.activeTextEditor
  const terminal = vscode.window.activeTerminal
  if (!terminal || !editor || editor.selections[0].isEmpty) {
    return
  }

  const selectMap = new Map<vscode.Selection, string>()

  for (const selectionIt of editor.selections) {
    if (selectionIt.isEmpty) {
      continue
    }
    try {
      selectMap.set(
        selectionIt,
        await experimentalEvalWithTerminal(
          editor.document.getText(selectionIt),
          terminal,
        ),
      )
    } catch (err) {
      console.error(err)
    }
  }

  await editor.edit((edit) => {
    selectMap.forEach((result, selectionIt) => {
      edit.replace(selectionIt, result)
    })
  })
}

type ShellId = 'pwsh' | 'cmd' | 'bash'

export async function experimentalEvalWithTerminal(
  code: string,
  terminal: vscode.Terminal,
) {
  const shellId: ShellId = /pwsh|powershell/i.test(terminal.name)
    ? 'pwsh'
    : /bash|wsl/.test(terminal.name)
    ? 'bash'
    : terminal.name === 'cmd'
    ? 'cmd'
    : process.platform === 'win32'
    ? 'pwsh'
    : 'bash'

  switch (shellId) {
    case 'pwsh':
      code = "scb -Value ((iex -Command @'\n" + code + '\n\'@) -join "`n")'
      break
    case 'cmd':
      code = code.replace(/\\n/g, ' && ') + ' | clip.exe'
      break
    case 'bash':
      code = code.replace(/\\n/g, '; ') + ' | clip'
      break
  }
  terminal.sendText(code)

  return new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      void vscode.env.clipboard.readText().then(resolve, reject)
    }, getExtConfig().receiveTimeout)
  })
}
