import { execFilePm, isWeb, isWin32, tokenToSignal } from '@/util'
import { SearchDict } from '@/util/searchDict'
import {
  CompletionItemKind,
  Range,
  type CancellationToken,
  type CompletionItem,
  type CompletionItemProvider,
  type ExtensionContext,
  type Position,
  type TextDocument,
} from 'vscode'

export class DictCompleteProvider implements CompletionItemProvider {
  private searchDict?: SearchDict
  constructor(context: ExtensionContext) {
    if (isWin32) {
      this.searchDict = new SearchDict(context)
    }
  }
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
  ) {
    const word = document.getText(
      document.getWordRangeAtPosition(position) ??
        new Range(position, position),
    )
    if (word.length < 2) {
      return
    }
    return (
      isWeb || isWin32
        ? await this.searchDict!.search(word)
        : await execFilePm('/usr/bin/look', [word], {
            signal: tokenToSignal(token),
          }).then(
            (r) => r.stdout.split('\n'),
            () => [],
          )
    ).map(
      (word) =>
        ({
          label: word,
          sortText: '10',
          kind: CompletionItemKind.Text,
        }) as CompletionItem,
    )
  }
}
