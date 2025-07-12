import type { ExecFileOptions } from 'child_process'
import path from 'path'
import stripAnsi from 'strip-ansi'
import { window, type Range } from 'vscode'
import { getExtConfig } from './config'
import { execFilePm } from './util'
import {
  getTerminalRunLanguageId,
  terminalRunCode,
} from './util/terminalRunCode'

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

export async function evalSelection() {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }

  const { document, selections } = editor
  const config = getExtConfig('evalSelection.languages')
  let { languageId } = document
  if (!Object.hasOwn(config, languageId)) {
    languageId = getTerminalRunLanguageId(languageId)
    if (!Object.hasOwn(config, languageId)) {
      return window.showWarningMessage('no eval config found for ' + languageId)
    }
  }
  const [cmd, ...args] = config[languageId].split(' ')
  const options: ExecFileOptions = {
    cwd: path.dirname(document.fileName),
  }

  const results = await Promise.all(
    (function* () {
      for (let range of selections as readonly Range[]) {
        if (range.isEmpty) {
          range = document.lineAt(range.start).range
        }
        yield execFilePm(
          cmd,
          args.concat(document.getText(range)),
          options,
        ).then(
          (r) => ({ text: r.stdout, range }),
          (e: unknown) => ({ text: String(e), range }),
        )
      }
    })(),
  )

  return editor.edit((edit) => {
    // ignore empty results, modify it directly
    for (const { text, range } of results) {
      edit.replace(range, text)
    }
  })
}

export async function terminalEvalSelection() {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }

  const { document } = editor
  const selectMap = new Map<Range, string>()

  for (let range of editor.selections as readonly Range[]) {
    let text: string
    if (range.isEmpty) {
      const line = document.lineAt(range.start.line)
      range = line.range
      text = line.text
    } else {
      text = document.getText(range)
    }

    text =
      (await terminalRunCode(
        text,
        getTerminalRunLanguageId(document.languageId),
      )) ?? ''
    if (!text.length) {
      continue
    }

    // first two lines are OSC 633 E record, last line is new prompt
    text = text
      .slice(text.indexOf('\x1b]633;C\x07') + 8, text.indexOf('\x1b]633;D'))
      .trimEnd()
    if (text.includes('\x1b[')) {
      text = stripAnsi(text)
    }
    selectMap.set(range, text)
  }

  if (!selectMap.size) {
    await window.showInformationMessage('no shell integration found')
    return
  }
  await editor.edit((edit) => {
    for (const [selectionRange, result] of selectMap) {
      edit.replace(selectionRange, result)
    }
  })
}

/**
 * Supports pwsh and bash execution.
 */
export async function terminalFilterSelection() {
  const editor = window.activeTextEditor
  const terminal = window.activeTerminal ?? window.createTerminal()
  if (
    !(
      editor &&
      terminal.shellIntegration &&
      ['pwsh', 'bash', 'gitbash', 'zsh', 'wsl'].includes(
        terminal.state.shell ?? '',
      )
    )
  ) {
    return
  }

  const { document, selections } = editor
  const lines = []
  for (const range of selections) {
    if (range.isEmpty) {
      lines.push(document.lineAt(range.start).text)
    } else {
      lines.push(document.getText(range).replaceAll('\r\n', '\n'))
    }
  }

  const usePwsh = terminal.state.shell === 'pwsh'
  terminal.show()
  terminal.sendText(
    usePwsh
      ? `@'\n${lines.join('\n')}\n'@.Split("\`n") | `
      : `(cat << 'EOF'\n${lines.join('\n')}\nEOF\n) | `,
    false,
  )
  let text = await new Promise<string>((resolve) => {
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
          return text
        })(),
      )
    })
  })

  text = text
    .slice(text.indexOf('\x1b]633;C\x07') + 8, text.indexOf('\x1b]633;D'))
    .trimEnd()
  if (text.includes('\x1b[')) {
    text = stripAnsi(text)
  }
  if (!text.length) {
    return
  }
  return editor.edit((edit) =>
    edit.replace(
      selections[0].isEmpty
        ? document.lineAt(selections[0].start).range
        : selections[0],
      text,
    ),
  )
}
