import { ExecFileOptions } from 'child_process'
import { writeFile } from 'fs/promises'
import path from 'path'
import util from 'util'
import vscode from 'vscode'
import { Worker } from 'worker_threads'
import { getExtConfig } from './utils/getExtConfig'
import { execFilePm, execPm } from './utils/nodeUtils'

export type LangId = 'cjs' | 'mjs' | 'deno' | 'pwsh' | 'cmd' | 'bash' | 'python'

export function registerApplyShellEdit(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand('mvext.applyShellEdit', applyShellEdit),
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
      const result = await execByLangId(text, langId)
      if (!/\s*/.test(result)) {
        selectMap.set(range, result)
        console.log(result)
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        await vscode.window.showErrorMessage(
          vscode.l10n.t(
            'SyntaxError: You may use `IIFE` wrapper instead:\n\t`(function () { /* code */ })()`',
          ),
        )
      }
      console.error('Eval error occurred:', err)
    }
  }

  await editor.edit((edit) => {
    selectMap.forEach((result, selectionIt) => {
      edit.replace(selectionIt, result)
    })
  })
}

export async function execByLangId(text: string, langId: LangId) {
  const editor = vscode.window.activeTextEditor
  const options: ExecFileOptions = {}
  if (editor) {
    const { document } = editor
    options.cwd =
      vscode.workspace.getWorkspaceFolder(document.uri)?.uri.fsPath ??
      path.join(document.fileName, '..')
  }

  switch (langId) {
    case 'cjs':
      return formatObj(await cjsEval(text))
    case 'mjs':
      return formatObj(await mjsEval(text))
    case 'deno':
      return (
        await execFilePm(
          langId,
          ['eval'].concat(reMjs.test(text) ? [text] : ['-p', text]),
          options,
        )
      ).stdout
    case 'pwsh':
      return (
        await execFilePm(
          getExtConfig().pwshExec,
          ['-NoProfile', '-C', text],
          options,
        )
      ).stdout
    case 'bash':
      return (await execFilePm(getExtConfig().bashExec, ['-c', text], options))
        .stdout
    case 'cmd': {
      const reEmptyLine = /^(?:\s+|)$/
      return (
        await execPm(
          text
            .split('\n')
            .filter((t) => !reEmptyLine.test(t))
            .join(' && '),
          { shell: 'cmd' },
        )
      ).stdout
    }
    case 'python':
      return (
        await execFilePm(
          process.platform === 'win32' ? 'py' : 'python3',
          ['-c', text],
          options,
        )
      ).stdout
  }
}

const reJs = /(?:java|type)script(?:react)?|vue|svelte|mdx|markdown/
const reMjs = /^import\s+.*?\s+from\s+(['"]).*?\1\s*$/m
function matchLangId(editorLangId: string, text: string): LangId {
  if (reJs.test(editorLangId)) {
    return getExtConfig().useDeno || editorLangId.startsWith('t')
      ? 'deno'
      : reMjs.test(text)
      ? 'mjs'
      : 'cjs'
  }

  switch (editorLangId) {
    case 'powershell':
      return 'pwsh'
    case 'bat':
      return 'cmd'
    case 'shellscript':
      return 'bash'
    case 'ignore':
      return process.platform === 'win32' ? 'pwsh' : 'bash'
    case 'python':
      return editorLangId
    default:
      throw Error('[Match] not supported editorLangId: ' + editorLangId)
  }
}

export async function mjsEval(text: string) {
  const mjsFile = path.join(__dirname, 'eval.mjs')
  const jsCode = `import { parentPort } from 'worker_threads'
;${text}
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
  ${hasMainEntry ? text : ''}
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
