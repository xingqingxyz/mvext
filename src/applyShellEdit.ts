import { ExecFileOptions } from 'child_process'
import { writeFile } from 'fs/promises'
import * as path from 'path'
import * as util from 'util'
import { Range, TextDocument, window, workspace } from 'vscode'
import { Worker } from 'worker_threads'
import { LangIds, execFilePm } from './utils'

export type LangId =
  | 'cjs'
  | 'mjs'
  | 'node'
  | 'powershell'
  | 'python'
  | 'unknown'

export async function applyShellEdit() {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }

  const { document } = editor
  const selectMap = new Map<Range, string>()

  for (const selectionIt of editor.selections) {
    const line = document.lineAt(selectionIt.start.line)
    const range = selectionIt.isEmpty ? line.range : selectionIt
    const text = selectionIt.isEmpty ? line.text : document.getText(selectionIt)
    const langId = matchLangId(document.languageId, text)

    try {
      const result = await execByLangId(text, langId, document)
      selectMap.set(range, result)
    } catch {
      /* empty */
    }
  }

  await editor.edit((edit) => {
    selectMap.forEach((result, selectionIt) => {
      edit.replace(selectionIt, result)
    })
  })
}

export async function execByLangId(
  text: string,
  langId: LangId,
  document: TextDocument,
) {
  const options: ExecFileOptions = {
    cwd: path.join(document.fileName, '..'),
  }

  switch (langId) {
    case 'cjs':
      return formatObj(await cjsEval(text))
    case 'mjs':
      return formatObj(await mjsEval(text))
    case 'node':
      try {
        const [cmd, ...args] = workspace
          .getConfiguration('mvext.applyShellEdit')
          .get('nodeCommandLine', ['node', '-e'])
        return (await execFilePm(cmd, args, options)).stdout.trimEnd()
      } catch (err) {
        return String(err)
      }
    case 'powershell':
      return (
        await execFilePm(
          workspace
            .getConfiguration('mvext.applyShellEdit')
            .get('pwshExec', 'pwsh'),
          ['-NoProfile', '-C', text],
          options,
        )
      ).stdout.trimEnd()
    case 'python':
      return (
        await execFilePm(
          process.platform === 'win32' ? 'py' : 'python3',
          ['-c', text],
          options,
        )
      ).stdout.trimEnd()
    default:
      throw Error('not support langId')
  }
}

function matchLangId(editorLangId: string, text: string): LangId {
  if (
    LangIds.langIdMarkup
      .concat('javascript', 'typescript')
      .includes(editorLangId)
  ) {
    return workspace
      .getConfiguration('mvext.applyShellEdit')
      .get<boolean>('useExternalNode')
      ? 'node'
      : /^(im|ex)port /m.test(text)
      ? 'mjs'
      : 'cjs'
  }

  switch (editorLangId) {
    case 'powershell':
    case 'python':
      return editorLangId
    case 'ignore':
    case 'properties':
      return 'powershell'
    default:
      return 'unknown'
  }
}

export async function mjsEval(text: string) {
  const mjsFile = path.join(__dirname, 'eval.mjs')
  const jsCode = `import { parentPort } from 'worker_threads'
;${text};
parentPort.postMessage(await main())`

  await writeFile(mjsFile, jsCode, 'utf8')
  const worker = new Worker(mjsFile)

  return new Promise<unknown>((resolve, reject) => {
    worker.on('message', (result) => {
      resolve(result)
      void worker.terminate()
    })
    worker.on('error', reject)
  })
}

export function cjsEval(text: string) {
  const hasMainEntry = text.includes('function main(')

  const jsCode = `const { parentPort } = require('worker_threads')
void (async function () {
  ${hasMainEntry ? text : ''};
  parentPort.postMessage(${
    hasMainEntry ? 'await main()' : 'eval(' + JSON.stringify(text) + ')'
  })
})()`

  const worker = new Worker(jsCode, { eval: true })

  return new Promise<unknown>((resolve, reject) => {
    worker.on('message', (result) => {
      resolve(result)
      void worker.terminate()
    })
    worker.on('error', reject)
  })
}

function formatObj(result: unknown) {
  switch (typeof result) {
    case 'object':
      return util.format('%o', result)
    case 'function':
      return util.format('%o', result) + '\n' + result.toString()
    default:
      return String(result)
  }
}

export async function applyCurrentShellEdit() {
  const editor = window.activeTextEditor
  const terminal = window.activeTerminal
  if (!(editor && terminal)) {
    return
  }

  const { document } = editor
  const selectMap = new Map<Range, string>()

  for (const selectionIt of editor.selections) {
    const line = document.lineAt(selectionIt.start.line)
    const range = selectionIt.isEmpty ? line.range : selectionIt
    const text = selectionIt.isEmpty ? line.text : document.getText(selectionIt)
    const result = await new Promise<string | undefined>((resolve) => {
      terminal.sendText(text)
      const event = window.onDidExecuteTerminalCommand((cmd) => {
        if (cmd.commandLine === text) {
          resolve(cmd.output?.trimEnd())
          event.dispose()
        }
      })
    })
    if (result) {
      selectMap.set(range, result)
    }
  }

  await editor.edit((edit) => {
    selectMap.forEach((result, selectionIt) => {
      edit.replace(selectionIt, result)
    })
  })
}
