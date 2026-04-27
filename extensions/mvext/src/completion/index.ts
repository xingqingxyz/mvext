import {
  type CancellationToken,
  commands,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type CompletionList,
  CompletionTriggerKind,
  type ExtensionContext,
  languages,
  type Position,
  type ProviderResult,
  type TextDocument,
} from 'vscode'
import { CSSCompletionItemProvider } from './css'
import { DictCompletionItemProvider } from './dict'
import { LineCompletionItemProvider } from './line'
import { UserCompletionItemProvider } from './user'

type InvokeCompleteKind = 'css' | 'dict' | 'line' | 'user' | 'none'

export class InvokeCompletionItemProvider implements CompletionItemProvider {
  private kind: InvokeCompleteKind = 'none'
  private css = new CSSCompletionItemProvider()
  private dict: CompletionItemProvider
  private line = new LineCompletionItemProvider()
  private user = new UserCompletionItemProvider()
  constructor(context: ExtensionContext) {
    this.dict = new DictCompletionItemProvider(context)
    context.subscriptions.push(
      commands.registerCommand(
        'mvext.invokeComplete',
        async (kind: InvokeCompleteKind) => {
          this.kind = kind
          await commands.executeCommand('editor.action.triggerSuggest')
          this.kind = 'none'
        },
      ),
      languages.registerCompletionItemProvider(
        [
          { scheme: 'file', pattern: '**' },
          { scheme: 'vscode-vfs', pattern: '**' },
          { scheme: 'vscode-remote', pattern: '**' },
        ],
        this,
      ),
    )
  }
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ): ProviderResult<CompletionItem[] | CompletionList> {
    if (
      context.triggerKind !== CompletionTriggerKind.Invoke ||
      this.kind === 'none'
    ) {
      return
    }
    return this[this.kind].provideCompletionItems(
      document,
      position,
      token,
      context,
    )
  }
}
