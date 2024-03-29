import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemProvider,
  CompletionList,
  Position,
  ProviderResult,
  TextDocument,
} from 'vscode'

export class TsPostfixCompleteProvider implements CompletionItemProvider {
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
    throw new Error('Method not implemented.')
  }
  resolveCompletionItem?(
    item: CompletionItem,
    token: CancellationToken,
  ): ProviderResult<CompletionItem> {
    throw new Error('Method not implemented.')
  }
}
