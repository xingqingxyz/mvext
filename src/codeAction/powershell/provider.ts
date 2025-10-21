import { requestEditorCommand } from '@/powershellExtension'
import {
  type CodeAction,
  type CodeActionContext,
  CodeActionKind,
  type CodeActionProvider,
  CodeActionTriggerKind,
  type Command,
  type ExtensionContext,
  languages,
  type ProviderResult,
  type Range,
  type Selection,
  type TextDocument,
} from 'vscode'

export class TransformCodeActionProvider implements CodeActionProvider {
  provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
  ): ProviderResult<(CodeAction | Command)[]> {
    if (
      context.triggerKind !== CodeActionTriggerKind.Invoke ||
      !context.only?.contains(CodeActionKind.RefactorRewrite)
    ) {
      return requestEditorCommand<CodeAction[]>('mvext.provideCodeActions')
    }
  }
  resolveCodeAction(codeAction: CodeAction): ProviderResult<CodeAction> {
    return codeAction
  }
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerCodeActionsProvider(
        { language: 'powershell', scheme: 'file' },
        this,
      ),
    )
  }
}
