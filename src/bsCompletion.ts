import vscode, { Range } from 'vscode'
import bsClasses from '../resources/bsClasses.json'

export function registerBsCompletion(ctx: vscode.ExtensionContext) {
  ctx.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      [
        'html',
        'javascript',
        'typescript',
        'javascriptreact',
        'typescriptreact',
      ],
      {
        provideCompletionItems,
      },
    ),
  )
}

const reProvideClasses = /=['"][^'"]*$/
export const provideCompletionItems: vscode.CompletionItemProvider['provideCompletionItems'] =
  (
    document: vscode.TextDocument,
    position: vscode.Position,
    // token: vscode.CancellationToken,
    // context: vscode.CompletionContext,
  ) => {
    if (
      position.character &&
      reProvideClasses.test(
        document.getText(
          new Range(
            position.with({
              character: 0,
            }),
            position,
          ),
        ),
      )
    ) {
      return bsCompletionList
    }
  }

const { Constant } = vscode.CompletionItemKind
const bsCompletionList = new vscode.CompletionList(
  bsClasses.map((c) => ({
    label: c,
    kind: Constant,
  })),
)
