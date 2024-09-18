import type { ExecFileOptions } from 'child_process'
import path from 'path'
import util from 'util'
import { window, type Range, type TextDocument } from 'vscode'
import { getExtConfig } from './config'
import { execFilePm, isWin32, noop } from './util'

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

export async function execByLangId(text: string, document: TextDocument) {
  const { languageId } = document
  let cmd: string[]
  if (nodeLangIds.includes(languageId)) {
    cmd = getExtConfig('shellEdit.node.cmd', document)
  } else if (['python', 'shellscript', 'powershell'].includes(languageId)) {
    cmd = getExtConfig(`shellEdit.${languageId}.cmd` as any, document)
  } else {
    cmd = isWin32
      ? getExtConfig('shellEdit.powershell.cmd', document)
      : getExtConfig('shellEdit.shellscript.cmd', document)
  }
  cmd.push(text)
  const options: ExecFileOptions = {
    cwd: path.dirname(document.fileName),
  }
  return execFilePm(cmd.shift()!, cmd, options).then(
    (r) => r.stdout,
    (err) => String(err),
  )
}

export async function applyShellEdit() {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }

  const { document, selections } = editor

  const results = await Promise.all(
    (function* () {
      for (const selectionRange of selections) {
        if (selectionRange.isEmpty) {
          yield execByLangId(
            document.lineAt(selectionRange.start.line).text,
            document,
          )
        } else {
          yield execByLangId(document.getText(selectionRange), document)
        }
      }
    })(),
  )

  await editor.edit((edit) => {
    // ignore empty results, modify it directly
    for (let i = 0; i < selections.length; i++) {
      if (selections[i].isEmpty) {
        edit.replace(document.lineAt(selections[i].start).range, results[i])
      } else {
        edit.replace(selections[i], results[i])
      }
    }
  })
}

export async function applyTerminalEdit() {
  const editor = window.activeTextEditor
  const terminal = window.activeTerminal
  if (!(editor && terminal)) {
    return
  }

  const { document } = editor
  const selectMap = new Map<Range, string>()

  for (let selectionRange of editor.selections as readonly Range[]) {
    let text: string
    if (selectionRange.isEmpty) {
      const line = document.lineAt(selectionRange.start.line)
      selectionRange = line.range
      text = line.text
    } else {
      text = document.getText(selectionRange)
    }

    await new Promise<void>((resolve, reject) => {
      const event = window.onDidExecuteTerminalCommand((e) => {
        if (e.terminal === terminal) {
          event.dispose()
          if (e.exitCode === 0 && e.output) {
            selectMap.set(selectionRange, e.output)
            resolve()
          } else {
            reject('command failed or no outputs')
          }
        }
      })
      terminal.sendText(text, true)
    }).catch(noop)
  }

  await editor.edit((edit) => {
    for (const [selectionRange, result] of selectMap) {
      edit.replace(selectionRange, result)
    }
  })
}

export async function applyTerminalFilter() {
  const editor = window.activeTextEditor
  const terminal = window.activeTerminal
  if (!(editor && terminal)) {
    return
  }
  terminal.show()

  const { document, selections } = editor
  const lines = []
  for (const selectionRange of selections) {
    if (selectionRange.isEmpty) {
      lines.push(document.lineAt(selectionRange.start).text)
    } else {
      lines.push(document.getText(selectionRange).replace(/\r\n?/g, '\n'))
    }
  }

  let text = lines.join('\n')
  let shellType: 'pwsh' | 'bash'
  if (
    terminal.creationOptions.name &&
    /pwsh|powershell/i.test(terminal.creationOptions.name)
  ) {
    shellType = 'pwsh'
  } else {
    shellType = isWin32 ? 'pwsh' : 'bash'
  }

  text = util.format(
    {
      pwsh: "@'\n%s\n'@ | ",
      bash: "(cat << 'EOF'\n%s\nEOF\n) | ",
    }[shellType],
    text,
  )

  return new Promise<string>((resolve, reject) => {
    const event = window.onDidExecuteTerminalCommand((e) => {
      if (e.terminal === terminal) {
        event.dispose()
        if (e.exitCode === 0 && e.output) {
          resolve(e.output)
        } else {
          reject('command failed or no outputs')
        }
      }
    })
    terminal.sendText(text)
  }).then(
    (result) => editor.edit((edit) => edit.replace(selections[0], result)),
    noop,
  )
}
