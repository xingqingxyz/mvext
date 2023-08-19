import vscode from 'vscode'

export interface ExtConfig {
  bashExec: string
  pwshExec: string
  receiveTimeout: number
  useDeno: boolean
}

let extConfig: Readonly<ExtConfig>

export function getExtConfig() {
  return extConfig
}

export function setupExtConfig(ctx: vscode.ExtensionContext) {
  setEvalWithSelection()
  ctx.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('mvext.evalWithSelection')) {
        setEvalWithSelection()
      }
    }),
  )
}

function setEvalWithSelection() {
  const cfg = vscode.workspace.getConfiguration('mvext.evalWithSelection')

  extConfig = Object.freeze({
    bashExec:
      cfg.get<string>('bashExecutable')! ||
      (process.platform === 'win32'
        ? 'C:\\Program Files\\Git\\bin\\bash.exe'
        : 'bash'),
    pwshExec: cfg.get<string>('pwshExecutable')! || 'pwsh',
    receiveTimeout: cfg.get<number>('experimentalReceiveTimeout')! || 500,
    useDeno: cfg.get<boolean>('useDeno')!,
  })
}
