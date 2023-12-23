import { extContext } from '@/context'
import { mergeIterables } from '@/util'
import path from 'path'
import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  CompletionTriggerKind,
  Position,
  TextDocument,
  languages,
  workspace,
} from 'vscode'

const markupLangIds = [
  'vue',
  'mdx',
  'html',
  'svelte',
  'javascriptreact',
  'typescriptreact',
]

class CssSelectorCompleteProvider implements CompletionItemProvider {
  static readonly reHtmlClassName =
    /(?<=\bclass(?:Name)?="(?:\S+\s+)*)[\w-]+(?=(?:\s+\S+)*")/g

  static readonly reClassesLine = /^[-.:#\w,>+~\\()[\] ]*$/

  /**
   * Completes scenarios:
   * - multi language with markup like html: completes in `<style>` tag, resolves head `<link>` tag
   * - stylesheets: completes in empty line or line starts with selector, resolves relative dir markups or workspace markups
   */
  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (context.triggerKind !== CompletionTriggerKind.TriggerCharacter) {
      return
    }
    const line = document.lineAt(position)
    if (
      position.character - line.firstNonWhitespaceCharacterIndex > 21 ||
      !CssSelectorCompleteProvider.reClassesLine.test(
        line.text.slice(
          line.firstNonWhitespaceCharacterIndex,
          position.character,
        ),
      )
    ) {
      return
    }

    if (markupLangIds.includes(document.languageId)) {
      const classNames = new Set(
        CssSelectorCompleteProvider.getMarkupClasses(document.getText()),
      )
      return Array.from(
        classNames,
        (className) =>
          new CompletionItem(className, CompletionItemKind.Constant),
      )
    }

    const relativeDirClasses =
      await CssSelectorCompleteProvider.getRelativeDirClasses(document, token)
    const items = Array.from(
      relativeDirClasses,
      (className) => new CompletionItem(className, CompletionItemKind.Constant),
    )

    return items
  }

  static async getRelativeDirClasses(
    document: TextDocument,
    token: CancellationToken,
  ) {
    const wspFolder = workspace.getWorkspaceFolder(document.uri)
    if (!wspFolder) {
      return new Set<string>()
    }

    const markups = await workspace.findFiles(
      `${
        __DEV__
          ? '**'
          : path
              .dirname(workspace.asRelativePath(document.uri, false))
              .replaceAll('\\', '/')
      }/*.{vue,html,jsx,tsx,mdx,svelte}`,
      undefined,
      20,
      token,
    )
    const { readFile } = workspace.fs
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
    return relativeDirClasses
  }

  static getMarkupClasses(documentText: string) {
    return (function* () {
      for (const m of documentText.matchAll(
        CssSelectorCompleteProvider.reHtmlClassName,
      )) {
        yield m[0]
      }
    })()
  }
}

export function register() {
  extContext.subscriptions.push(
    languages.registerCompletionItemProvider(
      ['css', 'scss', 'tailwindcss', 'html', 'vue', 'svelte', 'mdx'],
      new CssSelectorCompleteProvider(),
      '.',
    ),
  )
}
