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

export class LineCompleteProvider
  implements CompletionItemProvider, Disposable
{
  *filterActiveDocumentsLines(
    document: TextDocument,
    position: Position,
    needle: string,
    forIncomplete = false,
  ) {
    if (!forIncomplete) {
      const lines = document.getText().split('\n')
      // completion triggers when needle !== ''
      lines[position.line] = ''
      for (const text of lines) {
        if (text.startsWith(needle)) {
          yield text
        }
      }
      return
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

  private _enabled = getExtConfig('lineComplete.enabled')

  private _disposables: Disposable[] = [
    languages.registerCompletionItemProvider({ pattern: '**' }, this),
    workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('vincode.lineComplete.enabled')) {
        this._enabled = getExtConfig('lineComplete.enabled')
      }
    }),
  ]

  dispose() {
    for (const disposable of this._disposables) {
      disposable.dispose()
    }
  }

  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
    if (!this._enabled) {
      return
    }
    return Array.from(
      this.filterActiveDocumentsLines(
        document,
        position,
        document.getText(document.getWordRangeAtPosition(position)),
        context.triggerKind ===
          CompletionTriggerKind.TriggerForIncompleteCompletions,
      ),
      (text) => ({
        label: text,
        detail: text,
        kind: CompletionItemKind.Text,
      }),
    )
  }
}
