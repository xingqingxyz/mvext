import { ExecFileOptions } from 'child_process'
import { writeFile } from 'fs/promises'
import * as path from 'path'
import * as util from 'util'
import * as vscode from 'vscode'
import { Worker } from 'worker_threads'
import { LangIds } from './utils/constants'
import { getExtConfig } from './utils/getExtConfig'
import { execFilePm } from './utils/nodeUtils'

export type LangId = 'cjs' | 'mjs' | 'node' | 'powershell' | 'python'

export function registerApplyShellEdit(ctx: vscode.ExtensionContext) {
  const { registerCommand } = vscode.commands
  ctx.subscriptions.push(
    registerCommand('mvext.applyShellEdit', applyShellEdit),
    registerCommand('mvext.applyCurrentShellEdit', applyCurrentShellEdit),
  )
}

export async function applyShellEdit() {
  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }

  const { document } = editor
  const selectMap = new Map<vscode.Range, string>()

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
  document: vscode.TextDocument,
) {
  const options: ExecFileOptions = {
    cwd:
      vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath ??
      path.join(document.fileName, '..'),
  }

  switch (langId) {
    case 'cjs':
      return formatObj(await cjsEval(text))
    case 'mjs':
      return formatObj(await mjsEval(text))
    case 'node':
      try {
        const [cmd, ...args] = getExtConfig('applyShellEdit.nodeCommandLine')!
        return (await execFilePm(cmd, args, options)).stdout.trimEnd()
      } catch (err) {
        return String(err)
      }
    case 'powershell':
      return (
        await execFilePm(
          getExtConfig('applyShellEdit.pwshExec'),
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
      throw Error('not supported langId')
  }
}

function matchLangId(editorLangId: string, text: string): LangId {
  if (
    LangIds.langIdMarkup
      .concat('javascript', 'typescript')
      .includes(editorLangId)
  ) {
    return getExtConfig('applyShellEdit.nodeCommandLine')
      ? 'node'
      : /^import /m.test(text)
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
      throw Error('not supported langId: ' + editorLangId)
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
  const editor = vscode.window.activeTextEditor
  const terminal = vscode.window.activeTerminal
  if (!(editor && terminal)) {
    return
  }

  const { document } = editor
  const selectMap = new Map<vscode.Range, string>()

  for (const selectionIt of editor.selections) {
    const line = document.lineAt(selectionIt.start.line)
    const range = selectionIt.isEmpty ? line.range : selectionIt
    const text = selectionIt.isEmpty ? line.text : document.getText(selectionIt)
    const result = await new Promise<string | undefined>((resolve) => {
      terminal.sendText(text)
      const event = vscode.window.onDidExecuteTerminalCommand((cmd) => {
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
