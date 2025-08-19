import { type ExtensionContext, Uri, workspace } from 'vscode'
import { BaseLanguageClient } from 'vscode-languageclient'
import { LanguageClient as BrowserLanguageClient } from 'vscode-languageclient/browser'
import {
  Executable,
  LanguageClient,
  NodeModule,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node'
import which from 'which'
import { getOutput } from './util'

export function createClient(
  context: ExtensionContext
): Promise<BaseLanguageClient> {
  return (__WEB__ ? createBrowserClient : createNodeClient)(context)
}

async function createBrowserClient(context: ExtensionContext) {
  const serverMain = Uri.joinPath(context.extensionUri, 'dist/server-worker.js')
  // @ts-ignore
  const worker = new Worker(serverMain.toString(true))
  return new BrowserLanguageClient(
    'taplo-lsp',
    'Taplo LSP',
    await clientOpts(context),
    worker
  )
}

async function createNodeClient(context: ExtensionContext) {
  const out = getOutput()

  const bundled = !!workspace.getConfiguration().get('toml.taplo.bundled')

  let serverOpts: ServerOptions
  if (bundled) {
    const taploPath = Uri.joinPath(
      context.extensionUri,
      'dist/server.js'
    ).fsPath

    const run: NodeModule = {
      module: taploPath,
      transport: TransportKind.ipc,
      options: {
        env:
          workspace.getConfiguration().get('toml.taplo.environment') ??
          undefined,
      },
    }

    serverOpts = {
      run,
      debug: run,
    }
  } else {
    const taploPath =
      workspace.getConfiguration().get('toml.taplo.path') ??
      which.sync('taplo', { nothrow: true })

    if (typeof taploPath !== 'string') {
      out.appendLine('failed to locate Taplo LSP')
      throw new Error('failed to locate Taplo LSP')
    }

    let extraArgs = workspace.getConfiguration().get('toml.taplo.extraArgs')

    if (!Array.isArray(extraArgs)) {
      extraArgs = []
    }

    const args: string[] = (extraArgs as any[]).filter(
      (a) => typeof a === 'string'
    )

    const run: Executable = {
      command: taploPath,
      args: ['lsp', 'stdio', ...args],
      options: {
        env:
          workspace.getConfiguration().get('toml.taplo.environment') ??
          undefined,
      },
    }

    serverOpts = {
      run,
      debug: run,
    }
  }

  return new LanguageClient(
    'toml',
    'Even Better TOML LSP',
    serverOpts,
    await clientOpts(context)
  )
}

async function clientOpts(context: ExtensionContext): Promise<any> {
  await workspace.fs.createDirectory(context.globalStorageUri)

  return {
    documentSelector: [
      { scheme: 'file', language: 'toml' },
      { scheme: 'file', language: 'cargoLock' },
    ],

    initializationOptions: {
      configurationSection: 'toml',
      cachePath: context.globalStorageUri.fsPath,
    },
  }
}
