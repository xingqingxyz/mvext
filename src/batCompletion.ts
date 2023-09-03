import { EOL, homedir } from 'os'
import path from 'path'
import vscode from 'vscode'
import { execPm } from './utils/nodeUtils'
import winUtils from '../winUtils.json'

export function registerBatCompletion(ctx: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = {
    language: 'bat',
  }
  ctx.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(selector, {
      provideCompletionItems,
    }),
  )
}

export const provideCompletionItems: vscode.CompletionItemProvider['provideCompletionItems'] =
  async (
    document: vscode.TextDocument,
    position: vscode.Position,
    // token: vscode.CancellationToken,
    // context: vscode.CompletionContext,
  ) => {
    const range = document.getWordRangeAtPosition(position)
    const prefix = range ? document.getText(range) : ''

    let items: vscode.CompletionItem[] = []
    if (document.uri.scheme === 'file') {
      const wspFd = vscode.workspace.getWorkspaceFolder(document.uri)
      let result!: {
        stdout: string
        stderr: string
      }
      try {
        result = await execPm(
          'C:\\Windows\\System32\\where.exe ' +
            `"${
              wspFd ? path.dirname(wspFd.uri.fsPath) : homedir()
            };${process.env.Path!.replace(
              /C:\\Windows\\System32;/i,
              '',
            )}:${prefix}*.exe" "${prefix}*.bat" "${prefix}*.cmd"`,
        )

        const files = result.stdout.split(EOL)
        // remove last empty line
        files.pop()
        // const isIncomplete = files.length > 1

        const { Function } = vscode.CompletionItemKind
        items = files.map((f) => ({
          label: path.basename(f),
          detail: f,
          kind: Function,
        }))
      } catch (err) {
        console.log(result)
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        console.log(result?.stderr)
        console.error(err)
      }
    }

    const completionList = new vscode.CompletionList(builtins.concat(items))
    return completionList
  }

export const builtins = (function getBuiltins() {
  const batKeywords = [
    'do',
    'goto',
    ':EOF',
    'for',
    'if',
    'in',
    'else',
    'set',
    'setlocal',
  ]
  const batConstants = [
    '%CD%',
    '%TIME%',
    '%DATE%',
    '%RANDOM%',
    '%ERRORLEVEL%',
    '%CMDEXTVERSION%',
    '%CMDCMDLINE%',
    '%HIGHESTNUMAODENUMBER%',
  ]
  const batCommands = [
    'assoc',
    'break',
    'call',
    'cd',
    'cls',
    'color',
    'copy',
    'date',
    'del',
    'dir',
    'echo',
    'endlocal',
    'exit',
    'ftype',
    'md',
    'mklink',
    'move',
    'pause',
    'popd',
    'prompt',
    'pushd',
    'rd',
    'rem',
    'ren',
    'shift',
    'start',
    'time',
    'title',
    'type',
  ]

  const { Function, Keyword, Constant } = vscode.CompletionItemKind
  const kws: vscode.CompletionList['items'] = batKeywords.map((kw) => ({
    label: kw,
    kind: Keyword,
  }))
  const constants = batConstants.map((ct) => ({
    label: ct,
    kind: Constant,
  }))
  const cmds = batCommands.map((c) => ({
    label: c,
    kind: Function,
  }))
  const utils = Object.entries(winUtils).map(([key, val]) => ({
    label: key,
    detail: val,
    kind: Function,
  }))
  const combos = [
    'net computer',
    'net group',
    'net localgroup',
    'net print',
    'net session',
    'net share',
    'net start',
    'net stop',
    'net use',
    'net user',
    'net view',
  ].map((c) => ({ label: c, kind: Function }))

  return kws.concat(constants, cmds, utils, combos)
})()
