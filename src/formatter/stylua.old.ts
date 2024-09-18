import { getExtConfig } from '@/config'
import { findExeInPathSync, tokenToSignal } from '@/util'
import { execFile } from 'child_process'
import {
  Position,
  Range,
  TextEdit,
  type CancellationToken,
  type DocumentFormattingEditProvider,
  type DocumentRangeFormattingEditProvider,
  type FormattingOptions,
  type TextDocument,
} from 'vscode'

export class StyluaFormatter
  implements
    DocumentRangeFormattingEditProvider,
    DocumentFormattingEditProvider
{
  static readonly exePath = findExeInPathSync('stylua')

  async provideDocumentFormattingEdits(
    document: TextDocument,
    options: FormattingOptions,
    token: CancellationToken,
  ): Promise<TextEdit[]> {
    const output = await new Promise<string>((resolve, reject) => {
      const p = execFile(
        StyluaFormatter.exePath,
        [
          ...getExtConfig('stylua.extraArgs'),
          '--stdin-filepath',
          document.fileName,
          '--indent-type',
          options.insertSpaces ? 'Spaces' : 'Tabs',
          '--indent-width',
          options.tabSize + '',
          '-',
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

  async provideDocumentRangeFormattingEdits(
    document: TextDocument,
    range: Range,
    options: FormattingOptions,
    token: CancellationToken,
  ): Promise<TextEdit[] | null | undefined> {
    const output = await new Promise<string>((resolve, reject) => {
      const p = execFile(
        StyluaFormatter.exePath,
        [
          ...getExtConfig('stylua.extraArgs'),
          '--stdin-filepath',
          document.fileName,
          '--range-start',
          document.offsetAt(range.start) + '',
          '--range-end',
          document.offsetAt(range.end) + '',
          '--indent-type',
          options.insertSpaces ? 'Spaces' : 'Tabs',
          '--indent-width',
          options.tabSize + '',
          '-',
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
    return [new TextEdit(range, output)]
  }
}
