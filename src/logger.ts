import { window } from 'vscode'
import { client } from './client'

export async function showMessage(
  kind: 'info' | 'warn' | 'error',
  message: string
) {
  const method: keyof typeof window =
    kind === 'error'
      ? 'showErrorMessage'
      : kind === 'warn'
      ? 'showWarningMessage'
      : 'showInformationMessage'
  if (await window[method](message, 'Show Details')) {
    client.outputChannel.show()
  }
}
