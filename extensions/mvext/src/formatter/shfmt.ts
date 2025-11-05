import { getExtConfig } from '@/config'
import { tokenToSignal } from '@/util'
import { execFile } from 'child_process'
import { getProcessor } from 'sh-syntax'
import {
  languages,
  Range,
  TextEdit,
  Uri,
  workspace,
  type CancellationToken,
  type DocumentFormattingEditProvider,
  type ExtensionContext,
  type FormattingOptions,
  type TextDocument,
} from 'vscode'

export class ShfmtFormatter implements DocumentFormattingEditProvider {
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerDocumentFormattingEditProvider(
        [
          { scheme: 'file', language: 'shellscript' },
          { scheme: 'vscode-vfs', language: 'shellscript' },
          { scheme: 'vscode-remote', language: 'shellscript' },
        ],
        this,
      ),
    )
  }
  async provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken,
  ): Promise<TextEdit[]> {
    const output = await new Promise<string>((resolve, reject) => {
      const p = execFile(
        'shfmt',
        [
          ...getExtConfig('shfmt.extraArgs'),
          '--filename',
          document.fileName,
          '-i',
          options.insertSpaces ? options.tabSize.toString() : '0',
        ],
        {
          encoding: 'utf-8',
          signal: tokenToSignal(token),
        },
        (err, stdout) => {
          if (err) reject(new Error('shfmt executing error: ' + err.message))
          else resolve(stdout)
        },
      )
      p.stdin!.write(document.getText())
      p.stdin!.end()
    })
    return [new TextEdit(new Range(0, 0, document.lineCount, 0), output)]
  }
}

export class ShfmtFormatterWasm implements DocumentFormattingEditProvider {
  private processor: ReturnType<typeof getProcessor>
  constructor(context: ExtensionContext) {
    // non disposable processor, so prevent to leak wasm memory
    this.processor ??= getProcessor(() =>
      workspace.fs.readFile(
        Uri.joinPath(context.extensionUri, 'dist/shfmt.wasm'),
      ),
    )
    context.subscriptions.push(
      languages.registerDocumentFormattingEditProvider(
        [
          { scheme: 'file', language: 'shellscript' },
          { scheme: 'vscode-vfs', language: 'shellscript' },
          { scheme: 'vscode-remote', language: 'shellscript' },
        ],
        this,
      ),
    )
  }
  async provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
  ) {
    return [
      new TextEdit(
        new Range(0, 0, document.lineCount, 0),
        await this.processor(document.getText(), {
          ...getExtConfig('shfmt.optionsOnWeb'),
          indent: options.insertSpaces ? options.tabSize : 0,
          filepath: document.fileName,
          print: true,
        }),
      ),
    ]
  }
}
