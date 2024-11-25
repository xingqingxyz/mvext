import {
  type CancellationToken,
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
import { getExtConfig } from './config'

export class DictionaryCompleteProvider
  implements CompletionItemProvider, Disposable
{
  static *filterActiveDocumentsLines(
    document: TextDocument,
    position: Position,
    needle: string,
  ) {
    const lines = document.getText().split('\n')
    delete lines[position.line]
    for (const text of lines) {
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

  private _enabled = getExtConfig('vim.lineCompleteEnabled')

  private _disposables: Disposable[] = [
    languages.registerCompletionItemProvider({ pattern: '**' }, this, '#'),
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('vim.lineCompleteEnabled')) {
        this._enabled = getExtConfig('vim.lineCompleteEnabled')
      }
    }),
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
      context.triggerKind !== CompletionTriggerKind.TriggerCharacter
    ) {
      return
    }
    return Array.from(
      DictionaryCompleteProvider.filterActiveDocumentsLines(
        document,
        position,
        document.getText(
          document.getWordRangeAtPosition(
            position.with(position.line, position.character - 1),
          ),
        ),
      ),
      (text) => ({
        label: text,
        detail: text,
        kind: CompletionItemKind.Text,
      }),
    )
  }
}
