import { execFilePm, isWin32, tokenToSignal } from '@/util'
import {
  CompletionItemKind,
  Range,
  type CancellationToken,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type Position,
  type TextDocument,
} from 'vscode'

export class DictionaryCompleteProvider implements CompletionItemProvider {
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: CompletionContext,
  ) {
    if (isWin32) {
      return
    }
    const word = document.getText(
      document.getWordRangeAtPosition(position) ??
        new Range(position, position),
    )
    if (word.length < 3) {
      return
    }
    try {
      const result = await execFilePm('/usr/bin/look', [word], {
        signal: tokenToSignal(token),
      })
      return result.stdout.split('\n').map(
        (word) =>
          ({
            label: word,
            sortText: '10',
            kind: CompletionItemKind.Text,
          }) as CompletionItem,
      )
    } catch {
      return
    }
  }
}
