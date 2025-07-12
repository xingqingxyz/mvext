import { getExtConfig } from '@/config'
import { extContext } from '@/context'
import { tokenToSignal } from '@/util'
import { execFile } from 'child_process'
import {
  languages,
  Position,
  Range,
  TextEdit,
  type CancellationToken,
  type DocumentFormattingEditProvider,
  type FormattingOptions,
  type TextDocument,
} from 'vscode'

export class ShfmtFormatter implements DocumentFormattingEditProvider {
  constructor() {
    extContext.subscriptions.push(
      languages.registerDocumentFormattingEditProvider('shellscript', this),
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
          ...getExtConfig('shfmt.extraArgs', document),
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
    return [
      new TextEdit(
        new Range(
          new Position(0, 0),
          document.lineAt(document.lineCount - 1).range.end,
        ),
        output,
      ),
    ]
  }
}
