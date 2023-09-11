import { EOL, homedir } from 'os'
import path from 'path'
import vscode from 'vscode'
import winExes from './assets/winExes.json'
import { execFilePm, tokenToSignal } from './utils/nodeUtils'

export function registerBatCompletion(ctx: vscode.ExtensionContext) {
  const selector: vscode.DocumentSelector = {
    language: 'bat',
    scheme: 'file',
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
    token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ) => {
    if (
      position.character === 0 ||
      context.triggerKind === vscode.CompletionTriggerKind.Invoke
    ) {
      const wspFd = vscode.workspace.getWorkspaceFolder(document.uri)
      const range = document.getWordRangeAtPosition(position)
      const prefix = range ? document.getText(range) : ''

      let items: vscode.CompletionItem[] = []

      try {
        const files = (
          await execFilePm(
            'C:\\Windows\\System32\\where.exe',
            [
              `$PATH:${prefix}*.exe`,
              `$PATH:${prefix}*.bat`,
              `$PATH:${prefix}*.cmd`,
            ],
            {
              env: {
                Path:
                  (wspFd ? path.dirname(wspFd.uri.fsPath) : homedir()) +
                  ';' +
                  process.env.Path!.replace(/C:\\Windows\\System32;/i, ''),
              },
              signal: tokenToSignal(token),
            },
          )
        ).stdout.split(EOL)
        // remove last empty line
        files.pop()

        const { Function } = vscode.CompletionItemKind
        items = files.map((f) => ({
          label: path.basename(f),
          detail: f,
          kind: Function,
        }))
      } catch (err) {
        console.error(err)
      }

      return new vscode.CompletionList(builtins.concat(items))
    }
  }

export const builtins = (function getBuiltins() {
  const batKeywords = [
    'call',
    'do',
    'else',
    'endlocal',
    'exit',
    'for',
    'goto',
    'if',
    'in',
    'pause',
    'setlocal',
  ]
  const batConstants = [
    '%ALLUSERSPROFILE%',
    '%APPDATA%',
    '%CD%',
    '%CMDCMDLINE%',
    '%CMDEXTVERSION%',
    '%CommonProgramFiles(x86)%',
    '%CommonProgramFiles%',
    '%CommonProgramW6432%',
    '%COMPUTERNAME%',
    '%ComSpec%',
    '%DATE%',
    '%DriverData%',
    '%ERRORLEVEL%',
    '%HOMEDRIVE%',
    '%HOMEPATH%',
    '%LOCALAPPDATA%',
    '%LOGONSERVER%',
    '%NUMBER_OF_PROCESSORS%',
    '%NVIDIAWHITELISTED%',
    '%OS%',
    '%PATH%',
    '%PATHEXT%',
    '%PROCESSOR_ARCHITECTURE%',
    '%PROCESSOR_IDENTIFIER%',
    '%PROCESSOR_LEVEL%',
    '%PROCESSOR_REVISION%',
    '%ProgramData%',
    '%ProgramFiles(x86)%',
    '%ProgramFiles%',
    '%ProgramW6432%',
    '%PROMPT%',
    '%PUBLIC%',
    '%RANDOM%',
    '%SESSIONNAME%',
    '%SystemDrive%',
    '%SystemRoot%',
    '%TEMP%',
    '%TIME%',
    '%TMP%',
    '%USERDOMAIN%',
    '%USERNAME%',
    '%USERPROFILE%',
    '%WINDIR%',
  ]
  const batCommands = [
    'break',
    'cd',
    'cls',
    'color',
    'copy',
    'date',
    'del',
    'dir',
    'echo',
    'md',
    'mklink',
    'move',
    'popd',
    'prompt',
    'pushd',
    'rd',
    'ren',
    'set',
    'shift',
    'start',
    'time',
    'title',
    'type',
  ]

  const { Function, Keyword, Constant, Value } = vscode.CompletionItemKind
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
  const utils = Object.entries(winExes).map(([key, val]) => ({
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

  return kws.concat(constants, cmds, utils, combos, {
    label: 'EOF',
    kind: Value,
  })
})()
