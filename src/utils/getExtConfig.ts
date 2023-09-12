import * as vscode from 'vscode'

export interface ExtConfig {
  bashExec: string
  pwshExec: string
  useDeno: boolean
  shfmtParserOptions: string[]
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
  const formatter = vscode.workspace.getConfiguration('mvext.formatter')

  extConfig = Object.freeze({
    bashExec:
      applyShellEdit.get<string>('bashExecutable')! ||
      (process.platform === 'win32'
        ? 'C:\\Program Files\\Git\\bin\\bash.exe'
        : 'bash'),
    pwshExec: applyShellEdit.get<string>('pwshExecutable')! || 'pwsh',
    useDeno: applyShellEdit.get<boolean>('useDeno')!,
    shfmtParserOptions: formatter.get<string[]>('shfmtParserOptions')!,
  })
}
