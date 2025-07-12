/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  CompletionItemKind,
  Range,
  workspace,
  type CancellationToken,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type Position,
  type TextDocument,
} from 'vscode'

export class LineCompleteProvider implements CompletionItemProvider {
  *filterActiveDocumentsLines(
    document: TextDocument,
    position: Position,
    needle: string,
  ) {
    for (const textDocument of workspace.textDocuments) {
      if (textDocument === document) {
        continue
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
    context: CompletionContext,
  ) {
    return Array.from(
      this.filterActiveDocumentsLines(
        document,
        position,
        document.getText(
          document.getWordRangeAtPosition(position) ??
            new Range(
              position.with(undefined, Math.max(0, position.character - 3)),
              position,
            ),
        ),
      ),
      (text) =>
        ({
          label: text,
          sortText: '10',
          kind: CompletionItemKind.Text,
        }) as CompletionItem,
    )
  }
}
