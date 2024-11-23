import {
  type CancellationToken,
  commands,
  type CompletionContext,
  type CompletionItem,
  CompletionItemKind,
  type CompletionItemProvider,
  type CompletionList,
  CompletionTriggerKind,
  type Disposable,
  languages,
  type Position,
  type ProviderResult,
  type TextDocument,
  workspace,
} from 'vscode'
import { getExtContext } from './context'

export class LineCompleteProvider
  implements CompletionItemProvider, Disposable
{
  static *filterActiveDocumentsLines(
    document: TextDocument,
    linr: number,
    needle: string,
  ) {
    for (let i = 0; i < document.lineCount && i !== linr; i++) {
      const { text } = document.lineAt(i)
      if (text.startsWith(needle)) {
        yield text
      }
    }
    for (const doc of workspace.textDocuments) {
      if (doc === document) {
        continue
      }
      for (const text of doc.getText().split('\n')) {
        if (text.startsWith(needle)) {
          yield text
        }
      }
    }
  }

  private _enabled = getExtContext().globalState.get('enableLineComplete', true)

  private _disposables: Disposable[] = [
    languages.registerCompletionItemProvider({ pattern: '**' }, this),
    commands.registerCommand('_vim.toggleLineComplete', () =>
      getExtContext().globalState.update(
        'enableLineComplete',
        (this._enabled = !this._enabled),
      ),
    ),
  ]

  dispose() {
    for (const d of this._disposables) {
      d.dispose()
    }
  }

  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
    if (
      !this._enabled ||
      context.triggerKind !== CompletionTriggerKind.Invoke
    ) {
      return
    }
    return Array.from(
      LineCompleteProvider.filterActiveDocumentsLines(
        document,
        position.line,
        document.getText(document.getWordRangeAtPosition(position)),
      ),
      (text) => ({
        label: text,
        detail: text,
        kind: CompletionItemKind.Text,
      }),
    )
  }
}
