import { type OutputChannel, window } from 'vscode'
import { BaseLanguageClient } from 'vscode-languageclient'

let output: OutputChannel

export function getOutput(): OutputChannel {
  return (output ??= window.createOutputChannel('TOML'))
}

export async function showMessage(
  params: { kind: 'info' | 'warn' | 'error'; message: string },
  client: BaseLanguageClient
) {
  let show: string | undefined
  switch (params.kind) {
    case 'info':
      show = await window.showInformationMessage(params.message, 'Show Details')
      break
    case 'warn':
      show = await window.showWarningMessage(params.message, 'Show Details')
      break
    case 'error':
      show = await window.showErrorMessage(params.message, 'Show Details')
      break
  }
  if (show) {
    client.outputChannel.show()
  }
}
