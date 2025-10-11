import path from 'path'
import {
  commands,
  type ExtensionContext,
  type Terminal,
  Uri,
  window,
  workspace,
} from 'vscode'
import { getExtConfig } from './config'
import { ContextKey, WStateKey } from './context'

/**
 * Resolves python,(java|type)script(react)?,shellscript,powershell,csharp,
 * fsharp,bat,
 */
function getLangIdFromUri(uri: Uri) {
  const ext = path.extname(uri.path).slice(1).toLowerCase()
  switch (ext) {
    case 'js':
    case 'cjs':
    case 'mjs':
      return 'javascript'
    case 'ts':
    case 'cts':
    case 'mts':
      return 'typescript'
    case 'jsx':
      return 'javascriptreact'
    case 'tsx':
      return 'typescriptreact'
    case 'cmd':
      return 'bat'
    case 'cs':
      return 'csharp'
    case 'fs':
      return 'fsharp'
    case 'sh':
    case 'bash':
      return 'shellscript'
    case 'ps1':
    case 'psd1':
    case 'psm1':
      return 'powershell'
    case 'py':
    case 'pyw':
      return 'python'
    case 'gql':
      return 'graphql'
    case 'md':
      return 'markdown'
    default:
      return ext
  }
}

export async function terminalLaunch(
  uri: Uri,
  arg1: Uri[] | undefined | object,
  argstr = '',
) {
  switch (uri.scheme) {
    case 'file':
      break
    case 'untitled':
      if (!(await workspace.saveAll())) {
        return
      }
      break
    case 'vscode-vfs':
      await window.showWarningMessage('Please download the file first.')
      return
    case 'vscode-userdata':
      uri = Uri.file(uri.fsPath)
      break
    default:
      await window.showWarningMessage('Cannot handle uri scheme: ' + uri.scheme)
      return
  }
  const shells = ['bash', 'gitbash', 'pwsh', 'sh', 'wsl', 'zsh']
  const terminal =
    window.terminals
      .concat(window.activeTerminal ?? [])
      .findLast((t) => shells.includes(t.state.shell ?? '')) ??
    (await new Promise<Terminal>((resolve, reject) => {
      const terminal = window.createTerminal()
      const timeout = setTimeout(() => {
        event.dispose()
        reject('create terminal timeout')
      }, 6000)
      const event = window.onDidChangeTerminalState((t) => {
        if (t === terminal && t.state.isInteractedWith) {
          event.dispose()
          clearTimeout(timeout)
          resolve(t)
        }
      })
    }))
  terminal.show()
  let languageId
  languageId = Array.isArray(arg1)
    ? getLangIdFromUri(uri)
    : window.activeTextEditor!.document.languageId
  const config = getExtConfig('terminalLaunch.languageMap')
  if (!Object.hasOwn(config, languageId)) {
    languageId = await window.showQuickPick(Object.keys(config), {
      placeHolder: 'Select Language Id',
    })
    if (!languageId) {
      return
    }
  }
  terminal.sendText(
    `${config[languageId]} '${uri.fsPath.replaceAll(
      "'",
      terminal.state.shell === 'pwsh' ? "''" : "'\"'\"'",
    )}' ${argstr}`,
  )
}

export async function terminalLaunchArgs(context: ExtensionContext, uri: Uri) {
  const argStr = await window.showInputBox({
    title: 'Launch with Arguments',
    ignoreFocusOut: true,
    value: context.workspaceState.get(WStateKey.terminalLaunchLastArgs),
  })
  if (argStr === undefined) {
    return
  }
  context.workspaceState.update(WStateKey.terminalLaunchLastArgs, argStr)
  return terminalLaunch(uri, undefined, argStr)
}

export async function registerTerminalLaunch(context: ExtensionContext) {
  await commands.executeCommand(
    'setContext',
    ContextKey.terminalLaunchLanguages,
    Object.keys(getExtConfig('terminalLaunch.languageMap')),
  )
  context.subscriptions.push(
    commands.registerCommand('mvext.terminalLaunch', terminalLaunch),
    commands.registerCommand('mvext.terminalLaunchArgs', (uri) =>
      terminalLaunchArgs(context, uri),
    ),
    workspace.onDidChangeConfiguration(
      (e) =>
        e.affectsConfiguration('mvext.terminalLaunch.languageMap') &&
        commands.executeCommand(
          'setContext',
          ContextKey.terminalLaunchLanguages,
          Object.keys(getExtConfig('terminalLaunch.languageMap')),
        ),
    ),
  )
}
