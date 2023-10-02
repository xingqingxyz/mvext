import * as vscode from 'vscode'
import { LangIds } from './utils/constants'
import { mergeIterables } from './utils/nodeUtils'

export class CssSelectorCompleteProvider
  implements vscode.CompletionItemProvider
{
  static readonly reHtmlClassName =
    /(?<=\bclass(?:Name)?="(?:\S+\s+)*)[\w-]+(?=(?:\s+\S+)*")/g

  static readonly reClassesLine = /^([.:#][\w-]+\s+)*$/

  /**
   * Completes scenarios:
   * - multi language with markup like html: completes in `<style>` tag, resolves head `<link>` tag
   * - stylesheets: completes in empty line or line starts with selector, resolves relative dir markups or workspace markups
   */
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext,
  ) {
    if (context.triggerKind !== vscode.CompletionTriggerKind.TriggerCharacter) {
      return
    }

    const lineText = document.lineAt(position).text.slice(0, position.character)
    if (!CssSelectorCompleteProvider.reClassesLine.test(lineText)) {
      return
    }

    if (LangIds.langIdMarkup.includes(document.languageId)) {
      const classNames = new Set(
        CssSelectorCompleteProvider.getMarkupClasses(document.getText()),
      )

      const { Constant } = vscode.CompletionItemKind
      const compItems: vscode.CompletionItem[] = []
      for (const className of classNames) {
        compItems.push(new vscode.CompletionItem(className, Constant))
      }

      return compItems
    }

    const markups = await vscode.workspace.findFiles(
      vscode.workspace.asRelativePath(document.fileName) +
        '../{.,..}/*.{htm,html,jsx,tsx}',
      undefined,
      undefined,
      token,
    )
    const { readFile } = vscode.workspace.fs
    const relativeDirClasses = new Set(
      mergeIterables(
        await Promise.all(
          markups.map(async (m) => {
            const documentText = (await readFile(m)).toString()
            return CssSelectorCompleteProvider.getMarkupClasses(documentText)
          }),
        ),
      ),
    )
    const { Constant } = vscode.CompletionItemKind
    const compItems: vscode.CompletionItem[] = []
    for (const className of relativeDirClasses) {
      compItems.push(new vscode.CompletionItem(className, Constant))
    }

    return compItems
  }

  //#region utils
  static getMarkupClasses(documentText: string) {
    return (function* () {
      for (const m of documentText.matchAll(
        CssSelectorCompleteProvider.reHtmlClassName,
      )) {
        yield m[0]
      }
    })()
  }

  static register(ctx: vscode.ExtensionContext) {
    const selector = [
      'css',
      'scss',
      'tailwindcss',
      'html',
      'vue',
      'svelte',
      'mdx',
    ]
    ctx.subscriptions.push(
      vscode.languages.registerCompletionItemProvider(
        selector,
        new CssSelectorCompleteProvider(),
        '.',
      ),
    )
  }
  //#endregion
}
