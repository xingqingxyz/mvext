import { getExtConfig } from '@/config'
import { tokenToSignal } from '@/util'
import { execFile } from 'child_process'
import {
  languages,
  Position,
  Range,
  TextEdit,
  type CancellationToken,
  type Disposable,
  type DocumentFormattingEditProvider,
  type FormattingOptions,
  type TextDocument,
} from 'vscode'

export class ShfmtFormatter
  implements DocumentFormattingEditProvider, Disposable
{
  private _disposables: Disposable[]

  constructor() {
    this._disposables = [
      languages.registerDocumentFormattingEditProvider(['shellscript'], this),
    ]
  }

  dispose() {
    for (const d of this._disposables) {
      d.dispose()
    }
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
          options.insertSpaces ? options.tabSize + '' : '0',
        ],
        {
          encoding: 'utf-8',
          signal: tokenToSignal(token),
        },
        (err, stdout, stderr) => {
          if (err) reject(err)
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
