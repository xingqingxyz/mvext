import path from 'path'
import stripAnsi from 'strip-ansi'
import { window, type Range } from 'vscode'
import { getExtConfig } from './config'
import { execFilePm, setTimeoutPm } from './util'
import {
  getTerminalLaunchLanguageId,
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
function getCommandOutput(text: string) {
  // first two lines are OSC 633 E record, last line is new prompt
  text = text.slice(
    text.indexOf('\x1b]633;C\x07') + 8,
    text.indexOf('\x1b]633;D'),
  )
  if (text.includes('\x1b')) {
    text = stripAnsi(text)
  }
  return text.trimEnd()
}

export async function evalSelection() {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }

  const { document, selections } = editor
  const config = getExtConfig('evalSelection.languageMap')
  let { languageId } = document
  if (!(languageId in config)) {
    languageId = getTerminalLaunchLanguageId(languageId)
    if (!(languageId in config)) {
      await window.showWarningMessage('no eval config found for ' + languageId)
      return
    }
  }

  const [cmd, ...args] = config[languageId].split(' ')
  const results = await Promise.all(
    (function* () {
      for (let range of selections as readonly Range[]) {
        if (range.isEmpty) {
          range = document.lineAt(range.start).range
        }
        yield execFilePm(cmd, args.concat(document.getText(range)), {
          cwd: path.dirname(document.fileName),
          encoding: 'utf8',
        }).then(
          (r) => ({
            text: r.stdout.includes('\x1b') ? stripAnsi(r.stdout) : r.stdout,
            range,
          }),
          (e: unknown) => ({ text: String(e), range }),
        )
      }
    })(),
  )

  await editor.edit((edit) => {
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
  const languageId = getTerminalLaunchLanguageId(document.languageId)
  const selectMap = new Map<Range, string>()

  for (let range of editor.selections as readonly Range[]) {
    let text
    if (range.isEmpty) {
      const line = document.lineAt(range.start.line)
      range = line.range
      text = line.text
    } else {
      text = document.getText(range)
    }
    text = (await terminalRunCode(text, languageId)) ?? ''
    if (text.length) {
      selectMap.set(range, getCommandOutput(text))
    }
  }

  if (!selectMap.size) {
    return // no shell integration e.g. nodejs
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
  if (!editor) {
    return
  }
  const terminal =
    window.terminals
      .concat(window.activeTerminal ?? [])
      .findLast((t) => t.shellIntegration) ??
    (await setTimeoutPm(300, window.createTerminal()))

  const { document, selections } = editor
  const lines = []
  for (const range of selections) {
    if (range.isEmpty) {
      lines.push(document.lineAt(range.start).text)
    } else {
      lines.push(document.getText(range).replaceAll('\r\n', '\n'))
    }
  }

  terminal.show()
  terminal.sendText(
    terminal.state.shell === 'pwsh'
      ? `@'\n${lines.join('\n')}\n'@.Split("\`n") | `
      : `(cat << 'EOF'\n${lines.join('\n')}\nEOF\n) | `,
    false,
  )
  const text = await new Promise<string>((resolve) => {
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
        })().then(getCommandOutput),
      )
    })
  })
  if (!text.length) {
    return
  }

  await editor.edit((edit) =>
    edit.replace(
      selections[0].isEmpty
        ? document.lineAt(selections[0].start).range
        : selections[0],
      text,
    ),
  )
}
