import { execFilePm, isWin32, tokenToSignal } from '@/util'
import { SearchDict } from '@/util/searchDict'
import {
  CompletionItemKind,
  CompletionTriggerKind,
  languages,
  type CancellationToken,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type CompletionList,
  type ExtensionContext,
  type Position,
  type TextDocument,
} from 'vscode'

export class DictCompletionItemProvider implements CompletionItemProvider {
  private searchDict?: SearchDict
  constructor(context: ExtensionContext) {
    if (__WEB__ || isWin32) {
      this.searchDict = new SearchDict(context)
    }
    context.subscriptions.push(
      languages.registerCompletionItemProvider(
        [
          {
            pattern: '**',
            scheme: 'file',
          },
          {
            pattern: '**',
            scheme: 'untitled',
          },
          {
            pattern: '**',
            scheme: 'vscode-vfs',
          },
        ],
        this,
      ),
    )
  }
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (
      context.triggerKind !==
      CompletionTriggerKind.TriggerForIncompleteCompletions
    ) {
      return { isIncomplete: true } as CompletionList
    }
    const range = document.getWordRangeAtPosition(position)
    if (!range || range.end.character - range.start.character < 2) {
      return
    }
    return (
      __WEB__ || isWin32
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
