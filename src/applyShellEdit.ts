import { ExecFileOptions } from 'child_process'
import path from 'path'
import util from 'util'
import { Range, TextDocument, window, workspace } from 'vscode'
import { Worker } from 'worker_threads'
import { LangIds, execFilePm, noop } from './utils'

const jsLangIds = LangIds.langIdMarkup.concat(['javascript', 'typescript'])

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
    await execByLangId(text, document).then(
      (result) => selectMap.set(range, result),
      noop,
    )
  }

  await editor.edit((edit) => {
    selectMap.forEach((result, selectionIt) => {
      edit.replace(selectionIt, result)
    })
  })
}

export async function execByLangId(text: string, document: TextDocument) {
  const options: ExecFileOptions = {
    cwd: path.join(document.fileName, '..'),
  }

  if (jsLangIds.includes(document.languageId)) {
    const cfg = workspace.getConfiguration('mvext.applyShellEdit')
    try {
      if (cfg.get<boolean>('useExternalNode')) {
        const [cmd, ...args] = cfg.get('nodeCommandLine', ['node', '-e'])
        return (await execFilePm(cmd, args, options)).stdout.trimEnd()
      }
      return formatObj(await cjsEval(text, document))
    } catch (err) {
      return String(err)
    }
  }

  switch (document.languageId) {
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
    case 'shellscript':
      return (await execFilePm('bash', ['-c', text], options)).stdout.trimEnd()
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

export async function cjsEval(text: string, { fileName }: TextDocument) {
  const jsCode = `(async () => {
  ({ __dirname, __filename }) = require('node:worker_threads').workerData;
  return (${text})
})().then((r) => require('node:worker_threads').parentPort.postMessage(r))`
  const worker = new Worker(jsCode, {
    eval: true,
    workerData: {
      __dirname: fileName.slice(0, fileName.lastIndexOf('/')),
      __filename: fileName,
    },
  })
  try {
    return await new Promise((c, e) => worker.on('message', c).on('error', e))
  } finally {
    await worker.terminate()
  }
}

function formatObj(result: unknown) {
  switch (typeof result) {
    case 'object':
      return util.format('%o', result)
    case 'function':
      return util.format(
        '// [function %s]:\n%s\n// as obj:\n%o',
        result.name,
        result,
        Object.assign({}, result),
      )
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
