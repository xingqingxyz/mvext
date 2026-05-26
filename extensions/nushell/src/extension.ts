import { commands, Uri, window, workspace, type ExtensionContext } from 'vscode'
import { LanguageClient, State, Trace } from 'vscode-languageclient/node'
import which from 'which'
import { getExtConfig } from './config'

export async function activate(context: ExtensionContext) {
  const serverPath = await which(getExtConfig('server.path'))
    .catch(() => which('nu'))
    .catch(() => window.showErrorMessage('Nushell executable not found'))
  // no error to keep syntax highlighting
  if (!serverPath) {
    return
  }
  const client = new LanguageClient(
    'nushell',
    'Nushell',
    {
      command: serverPath,
      args: ['--lsp'].concat(getExtConfig('server.extraArgs')),
    },
    {
      documentSelector: ['nushell'],
      markdown: {
        isTrusted: true,
        supportHtml: true,
      },
      initializationOptions: {
        timeout: 10_000,
      },
      synchronize: {
        fileEvents: workspace.createFileSystemWatcher('**/*.nu'),
      },
    },
  )
  const trace = getExtConfig('server.trace')
  await client.setTrace(
    Trace[(trace[0].toUpperCase() + trace.slice(1)) as 'Off'],
  )
  await client.start()
  context.subscriptions.push(
    client,
    commands.registerCommand('nushell.restartLanguageServer', async () => {
      await commands.executeCommand('typescript.restartTsServer')
      if (client.state === State.Running) {
        await client.stop()
      }
      await client.start()
    }),
    window.registerTerminalProfileProvider('nushell', {
      provideTerminalProfile() {
        return {
          options: {
            name: 'Nushell',
            shellPath: serverPath,
            iconPath: Uri.joinPath(context.extensionUri, 'assets/nu.svg'),
          },
        }
      },
    }),
  )
}
