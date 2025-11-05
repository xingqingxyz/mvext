import {
  CompletionItemKind,
  Range,
  window,
  workspace,
  type CancellationToken,
  type CompletionItem,
  type CompletionItemProvider,
  type Position,
  type TextDocument,
} from 'vscode'

export class LineCompleteProvider implements CompletionItemProvider {
  *filterDocumentLines(
    document: TextDocument,
    needle: string,
    token: CancellationToken,
  ) {
    for (const textDocument of workspace.textDocuments) {
      if (token.isCancellationRequested) {
        return
      }
      for (const line of textDocument
        .getText()
        .split('\r\n'.slice(2 - textDocument.eol))) {
        if (line.includes(needle)) {
          yield line.trimStart()
        }
      }
    }
  }
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
  ) {
    const { selection } = window.activeTextEditor!
    const range = selection.isEmpty
      ? (document.getWordRangeAtPosition(position) ??
        new Range(
          position.with(undefined, Math.max(0, position.character - 3)),
          position,
        ))
      : selection
    return Array.from(
      this.filterDocumentLines(document, document.getText(range), token),
      (text) =>
        ({
          label: text,
          sortText: '10',
          kind: CompletionItemKind.Text,
        }) as CompletionItem,
    )
  }
}
