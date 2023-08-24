import { ExecFileOptions, execFile } from 'child_process'
import { writeFile } from 'fs/promises'
import path from 'path'
import { setTimeout } from 'timers/promises'
import util from 'util'
import vscode from 'vscode'
import { getExtConfig } from './utils/getExtConfig'
import { cjsEval, mjsEval } from './utils/jsEval'

const execFilePm = util.promisify(execFile)

export type LangId = 'cjs' | 'mjs' | 'deno' | 'pwsh' | 'cmd' | 'bash'

export function registerEvalWithSelection(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.commands.registerCommand(
      'mvext.evalWithSelection',
      evalWithSelection,
    ),
    vscode.commands.registerCommand(
      'mvext.evalByShellIntegration',
      evalByShellIntegration,
    ),
  )
}

export async function evalWithSelection() {
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
      selectMap.set(range, await evalByLangId(text, langId))
    } catch (err) {
      if (err instanceof SyntaxError || langId === 'deno') {
        await vscode.window.showErrorMessage(
          vscode.l10n.t(
            'SyntaxError: You may need to use wrapper (function () {\n\t/* code */\n})() instead.',
          ),
        )
      }
      console.error(err)
    }
  }

  await editor.edit((edit) => {
    selectMap.forEach((result, selectionIt) => {
      edit.replace(selectionIt, result)
    })
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

export async function evalByLangId(text: string, langId: LangId) {
  const documentUri = vscode.window.activeTextEditor?.document.uri
  const options: ExecFileOptions = {}
  if (documentUri) {
    options.cwd = vscode.workspace.getWorkspaceFolder(documentUri)?.uri.fsPath
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
      const cmdFile = path.join(__dirname, 'eval.bat')
      await writeFile(cmdFile, text, 'utf-8')
      return (await execFilePm(langId, ['/D', '/C', cmdFile], options)).stdout
    }
    default:
      throw Error('[Eval] not identified langId: ' + (langId as string))
  }
}

const reJs = /(?:java|type)script(?:react)?|vue|svelte|mdx|markdown/
const reMjs = /^import\s+.*?\s+from\s+(['"]).*?\1\s*$/m
function matchLangId(editorLangId: string, text: string): LangId {
  if (reJs.test(editorLangId)) {
    return getExtConfig().useDeno ? 'deno' : reMjs.test(text) ? 'mjs' : 'cjs'
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
    default:
      throw Error('[Match] not supported editorLangId: ' + editorLangId)
  }
}

export type ShellId = 'pwsh' | 'cmd' | 'bash' | 'unknown'

export async function evalByTerminal(code: string, terminal: vscode.Terminal) {
  const shellId: ShellId = /bash|wsl/.test(terminal.name)
    ? 'bash'
    : /pwsh|powershell/i.test(terminal.name)
    ? 'pwsh'
    : terminal.name === 'cmd'
    ? 'cmd'
    : 'unknown'

  switch (shellId) {
    case 'pwsh':
      code = "scb (iex @'\n" + code + "\n'@)"
      break
    case 'cmd':
      code = code.replace(/\s*$/, ' | clip.exe')
      break
    case 'bash':
      code = code.replace(/\s*$/, ' | clipboard')
      break
    default:
      terminal.sendText(code)
      return
  }

  terminal.sendText(code)
  await setTimeout(getExtConfig().receiveTimeout)
  return vscode.env.clipboard.readText().then((text) => {
    if (text.length) {
      return text
    }
  })
}

export async function evalByShellIntegration() {
  const terminal = vscode.window.activeTerminal
  if (!terminal) {
    return
  }

  const editor = vscode.window.activeTextEditor
  if (!editor) {
    return
  }

  const selectMap = new Map<vscode.Range, string>()

  for (const selectionIt of editor.selections) {
    const line = editor.document.lineAt(selectionIt.start.line)
    const range = selectionIt.isEmpty ? line.range : selectionIt
    const result = await evalByTerminal(
      selectionIt.isEmpty ? line.text : editor.document.getText(selectionIt),
      terminal,
    )
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
