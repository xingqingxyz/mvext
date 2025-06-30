import { type Uri, window, workspace } from 'vscode'
import { getExtConfig } from './config'
import { extContext, WStateKey } from './context'

/**
 * Resolves python,(java|type)script(react)?,shellscript,powershell,csharp,fsharp,
 * bat,
 */
function getLangIdByExt(ext: string) {
  ext = ext.toLowerCase()
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
  arg2: Uri[] | undefined | object,
  argstr = '',
) {
  if (uri.scheme !== 'file') {
    window.showWarningMessage('Please save or download the file first.')
    return
  }
  if (!(await workspace.saveAll())) {
    return
  }
  const terminal = window.activeTerminal ?? window.createTerminal()
  terminal.show()
  let languageId
  languageId = Array.isArray(arg2)
    ? getLangIdByExt(uri.path.split('.').at(-1)!)
    : window.activeTextEditor!.document.languageId
  const config = getExtConfig('terminalLaunch.languages')
  if (!Object.hasOwn(config, languageId)) {
    languageId = await window.showQuickPick(Object.keys(config), {
      placeHolder: 'Select Language Id',
    })
    if (!languageId) {
      return
    }
  }
  terminal.sendText(`${config[languageId]} '${uri.fsPath}' ${argstr}`)
}

export async function terminalLaunchArgs(uri: Uri) {
  const argStr = await window.showInputBox({
    title: 'Launch with Arguments',
    ignoreFocusOut: true,
    value: extContext.workspaceState.get(WStateKey.terminalLaunchLastArgs),
  })
  if (argStr === undefined) {
    return
  }
  extContext.workspaceState.update(WStateKey.terminalLaunchLastArgs, argStr)
  return terminalLaunch(uri, undefined, argStr)
}
