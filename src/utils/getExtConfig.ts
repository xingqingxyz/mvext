import * as vscode from 'vscode'

export interface ExtConfig {
  pwshExec: string
  useDeno: boolean
}

let extConfig: Readonly<ExtConfig>

export function getExtConfig() {
  return extConfig
}

export function setupExtConfig(ctx: vscode.ExtensionContext) {
  setExtCfg()
  ctx.subscriptions.push(vscode.workspace.onDidChangeConfiguration(setExtCfg))
}

function setExtCfg() {
  const applyShellEdit = vscode.workspace.getConfiguration(
    'mvext.applyShellEdit',
  )

  extConfig = Object.freeze({
    pwshExec: applyShellEdit.get<string>('pwshExecutable')! || 'pwsh',
    useDeno: applyShellEdit.get<boolean>('useDeno')!,
  })
}
