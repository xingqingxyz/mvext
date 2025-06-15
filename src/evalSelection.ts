import type { ExecFileOptions } from 'child_process'
import { execFile } from 'child_process'
import path from 'path'
import stripAnsi from 'strip-ansi'
import { promisify } from 'util'
import { window, type Range, type TextDocument } from 'vscode'
import { getExtConfig } from './config'
import { isWin32 } from './util'

/**
 * OSC 633 ; A ST - Mark prompt start.
 *
 * OSC 633 ; B ST - Mark prompt end.
 *
 * OSC 633 ; C ST - Mark pre-execution.
 *
 * OSC 633 ; D [; <exitcode>] ST - Mark execution finished with an optional exit code.
 *
 * OSC 633 ; E ; <commandline> [; <nonce] ST - Explicitly set the command line with an optional nonce.
 */

const execFilePm = promisify(execFile)
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
    cmd = getExtConfig('evalSelection.node.cmd', document)
  } else if (['python', 'shellscript', 'powershell'].includes(languageId)) {
    cmd = getExtConfig(`evalSelection.${languageId}.cmd` as any, document)
  } else {
    cmd = isWin32
      ? getExtConfig('evalSelection.powershell.cmd', document)
      : getExtConfig('evalSelection.shellscript.cmd', document)
  }
  cmd.push(text)
  const options: ExecFileOptions = {
    cwd: path.dirname(document.fileName),
  }
  return execFilePm(cmd.shift()!, cmd, options).then(
    (r) => r.stdout,
    (err: unknown) => String(err),
  )
}

export async function evalSelection() {
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

export async function terminalEvalSelection() {
  const editor = window.activeTextEditor
  const shellIntegration = window.activeTerminal?.shellIntegration
  if (!(editor && shellIntegration)) {
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

    const execution = shellIntegration.executeCommand(text)
    text = ''
    for await (const data of execution.read()) {
      text += data
    }

    // first two lines are OSC 633 E record, last line is new prompt
    text = text
      .slice(text.indexOf('\x1b]633;C\x07') + 8, text.indexOf('\x1b]633;D'))
      .trimEnd()
    if (text.includes('\x1b[')) {
      text = stripAnsi(text)
    }
    if (!text.length) {
      void window.showWarningMessage(
        'No output found for command: ' + execution.commandLine.value,
      )
    }
    selectMap.set(selectionRange, text)
  }

  await editor.edit((edit) => {
    for (const [selectionRange, result] of selectMap) {
      edit.replace(selectionRange, result)
    }
  })
}

export function terminalFilterSelection() {
  const editor = window.activeTextEditor
  const terminal = window.activeTerminal
  if (!(editor && terminal?.shellIntegration)) {
    return
  }
  const { document, selections } = editor
  const receiver = new Promise((resolve, reject) => {
    const event = window.onDidStartTerminalShellExecution((e) => {
      if (e.shellIntegration !== terminal.shellIntegration) {
        return
      }
      event.dispose()
      resolve(
        (async () => {
          let text = ''
          for await (const data of e.execution.read()) {
            text += data
          }
          text = text
            .slice(
              text.indexOf('\x1b]633;C\x07') + 8,
              text.indexOf('\x1b]633;D'),
            )
            .trimEnd()
          if (text.includes('\x1b[')) {
            text = stripAnsi(text)
          }
          if (!text.length) {
            return window.showWarningMessage('No output found')
          }
          return editor.edit((edit) =>
            edit.replace(
              selections[0].isEmpty
                ? document.lineAt(selections[0].start).range
                : selections[0],
              text,
            ),
          )
        })(),
      )
    })
  })

  const lines = []
  for (const selectionRange of selections) {
    if (selectionRange.isEmpty) {
      lines.push(document.lineAt(selectionRange.start).text)
    } else {
      lines.push(document.getText(selectionRange).replace(/\r\n?/g, '\n'))
    }
  }

  const nameMatches = terminal.name.match(/(powershell|pwsh)|(bash|wsl)|.*/i)!
  if (nameMatches[1]) {
    terminal.sendText(`@'\n${lines.join('\n')}\n'@ -split "\`n" | `)
  } else if (nameMatches[2]) {
    terminal.sendText(`(cat << 'EOF'\n${lines.join('\n')}\nEOF\n) | `)
  }
  terminal.show()
  return receiver
}
