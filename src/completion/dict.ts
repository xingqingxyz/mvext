import { execFilePm, isWeb, isWin32, tokenToSignal } from '@/util'
import { SearchDict } from '@/util/searchDict'
import {
  CompletionItemKind,
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
    if (isWeb || isWin32) {
      this.searchDict = new SearchDict(context)
    }
  }
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
  ) {
    const range = document.getWordRangeAtPosition(position)
    if (!range || range.end.character - range.start.character < 2) {
      return
    }
    return (
      isWeb || isWin32
        ? await this.searchDict!.search(document.getText(range))
        : await execFilePm('/usr/bin/look', [document.getText(range)], {
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
