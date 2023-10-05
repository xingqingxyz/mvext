import { homedir } from 'os'
import * as vscode from 'vscode'

export interface ExtConfig {
  'applyShellEdit.pwshExec': string
  'applyShellEdit.nodeCommandLine': string[] | undefined
  'pathComplete.expandPaths': Record<string, string>
}

const extConfig = {} as unknown as ExtConfig

export function getExtConfig<T extends keyof ExtConfig>(section: T) {
  return extConfig[section]
}

export function setupExtConfig(ctx: vscode.ExtensionContext) {
  updateExtCfg()
  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('mvext')) {
        updateExtCfg()
      }
    }),
  )
}

function updateExtCfg() {
  const cfg = vscode.workspace.getConfiguration('mvext')
  extConfig['applyShellEdit.pwshExec'] = cfg.get('applyShellEdit.pwshExec')!
  extConfig['applyShellEdit.nodeCommandLine'] = cfg.get(
    'applyShellEdit.nodeCommandLine',
  )

  // path mappings
  const wspFolder = vscode.workspace.workspaceFolders?.[0].uri.fsPath ?? ''
  const defaultExpandPaths = {
    '~': homedir(),
    '${workspaceFolder}': wspFolder,
    '@': wspFolder + '/src',
  }
  const allCfgs = cfg.inspect('pathComplete.expandPaths')!
  const cfgExpandPaths = (allCfgs.workspaceValue ??
    allCfgs.globalValue ??
    {}) as Record<string, string>

  for (const key of Object.keys(cfgExpandPaths)) {
    let val = cfgExpandPaths[key]
    if (val[0] === '~') {
      val = val.replace('~', homedir())
    }
    for (const matches of val.matchAll(/\$\{(?:(\w+)|env:(\w+))\}/g)) {
      if (matches[2]) {
        // env
        val = val.replace(matches[0], process.env[matches[2]] ?? '')
      } else {
        val = val.replace('${workspaceFolder}', wspFolder)
      }
    }
    cfgExpandPaths[key] = val
  }
  extConfig['pathComplete.expandPaths'] = Object.assign(
    defaultExpandPaths,
    cfgExpandPaths,
  )
}
