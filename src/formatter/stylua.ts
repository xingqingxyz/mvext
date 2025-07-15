import { getExtConfig } from '@/config'
import { tokenToSignal } from '@/util'
import { execFile } from 'child_process'
import {
  languages,
  Position,
  Range,
  TextEdit,
  type CancellationToken,
  type DocumentFormattingEditProvider,
  type DocumentRangeFormattingEditProvider,
  type ExtensionContext,
  type FormattingOptions,
  type TextDocument,
} from 'vscode'

export class StyluaFormatter
  implements DocumentRangeFormattingEditProvider, DocumentFormattingEditProvider
{
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerDocumentFormattingEditProvider('lua', this),
      languages.registerDocumentRangeFormattingEditProvider('lua', this),
    )
  }
  async provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken,
  ): Promise<TextEdit[]> {
    const output = await new Promise<string>((resolve, reject) => {
      const p = execFile(
        'stylua',
        [
          ...getExtConfig('stylua.extraArgs', document),
          '--stdin-filepath',
          document.fileName,
          '--indent-type',
          options.insertSpaces ? 'Spaces' : 'Tabs',
          '--indent-width',
          options.tabSize.toString(),
          '-',
        ],
        {
          encoding: 'utf-8',
          signal: tokenToSignal(token),
        },
        (err, stdout) => {
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
  async provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    options: FormattingOptions,
    token: CancellationToken,
  ): Promise<TextEdit[] | null | undefined> {
    const output = await new Promise<string>((resolve, reject) => {
      const p = execFile(
        'stylua',
        [
          ...getExtConfig('stylua.extraArgs', document),
          '--stdin-filepath',
          document.fileName,
          '--range-start',
          document.offsetAt(range.start).toString(),
          '--range-end',
          document.offsetAt(range.end).toString(),
          '--indent-type',
          options.insertSpaces ? 'Spaces' : 'Tabs',
          '--indent-width',
          options.tabSize.toString(),
          '-',
        ],
        {
          encoding: 'utf-8',
          signal: tokenToSignal(token),
        },
        (err, stdout) => {
          if (err) reject(err)
          else resolve(stdout)
        },
      )
      p.stdin!.write(document.getText())
      p.stdin!.end()
    })
    return [new TextEdit(range, output)]
  }
}
