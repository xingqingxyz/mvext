import { ExecFileOptions } from 'child_process'
import { EOL } from 'os'
import * as path from 'path'
import * as util from 'util'
import { Range, TextDocument, window } from 'vscode'
import { getConfig } from './config'
import { execFilePm, isWin32 } from './util'

const nodeLangIds = [
  'javascript',
  'typescript',
  'javascriptreact',
  'typescriptreact',
  'vue',
  'mdx',
  'html',
  'svelte',
]

export async function applyShellEdit() {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }

  const { document } = editor
  const selectMap = new Map<Range, string>()

  for (const selectionRange of editor.selections) {
    const line = document.lineAt(selectionRange.start.line)
    const range = selectionRange.isEmpty ? line.range : selectionRange
    const text = selectionRange.isEmpty
      ? line.text
      : document.getText(selectionRange)
    const result = await execByLangId(text, document)
    result && selectMap.set(range, result)
  }

  await editor.edit((edit) => {
    for (const [selectionRange, result] of selectMap.entries()) {
      edit.replace(selectionRange, result)
    }
  })
}

export async function execByLangId(text: string, document: TextDocument) {
  const { languageId } = document
  const config = getConfig(document, 'shellEdit')
  let [exe, ...args] =
    config[`${isWin32 ? 'powershell' : 'shellscript'}CommandLine`]
  if (nodeLangIds.includes(languageId)) {
    ;[exe, ...args] = config.nodeCommandLine
  }
  if (['python', 'shellscript', 'powershell'].includes(languageId)) {
    ;[exe, ...args] = (config as any)[languageId + 'CommandLine']
  }
  args.push(text)
  const options: ExecFileOptions = {
    cwd: path.dirname(document.fileName),
  }
  return (
    await execFilePm(exe, args, options).catch((err) => ({
      stdout: String(err),
    }))
  ).stdout.trimEnd()
}

export async function applyCurrentShellEdit() {
  const editor = window.activeTextEditor
  const terminal = window.activeTerminal
  if (!(editor && terminal)) {
    return
  }

  const { document } = editor
  const selectMap = new Map<Range, string>()

  for (const selectionRange of editor.selections) {
    const line = document.lineAt(selectionRange.start.line)
    const range = selectionRange.isEmpty ? line.range : selectionRange
    const text = selectionRange.isEmpty
      ? line.text
      : document.getText(selectionRange)
    const result = await new Promise<string | undefined>((resolve) => {
      const event = window.onDidExecuteTerminalCommand((e) => {
        if (e.terminal === terminal) {
          resolve(e.output?.trimEnd())
          event.dispose()
        }
      })
      terminal.sendText(text)
    })
    if (result) {
      selectMap.set(range, result)
    }
  }

  await editor.edit((edit) => {
    for (const [selectionRange, result] of selectMap.entries()) {
      edit.replace(selectionRange, result)
    }
  })
}

const shellFilterPrefix = {
  pwsh: "@'\n%s\n'@ | ".replaceAll('\n', EOL),
  bash: 'cat << EOF\n%s\nEOF | '.replaceAll('\n', EOL),
}

export async function applyShellFilter() {
  const editor = window.activeTextEditor
  const terminal = window.activeTerminal
  if (!(editor && terminal)) {
    return
  }
  terminal.show()

  const { document, selections } = editor
  const docEOL = ['\n', '\r\n'][document.eol - 1]
  let text = ''
  for (const selectionRange of selections) {
    if (selectionRange.isEmpty) {
      text += document.lineAt(selectionRange.start).text.trimEnd() + docEOL
    } else {
      text += document.getText(selectionRange).trimEnd() + docEOL
    }
  }
  if (docEOL !== EOL) {
    text = text.replaceAll(docEOL, EOL)
  }
  let shellType: 'pwsh' | 'bash' = isWin32 ? 'pwsh' : 'bash'
  if (/pwsh|powershell/i.test(terminal.creationOptions.name ?? '')) {
    shellType = 'pwsh'
  }
  text = util.format(shellFilterPrefix[shellType], text)

  const result = await new Promise<string | undefined>((resolve) => {
    const event = window.onDidExecuteTerminalCommand((e) => {
      if (e.terminal === terminal) {
        resolve(e.output)
        event.dispose()
      }
    })
    terminal.sendText(text)
  })

  if (result) {
    await editor.edit((edit) => {
      edit.replace(selections[0], result)
    })
  }
}
