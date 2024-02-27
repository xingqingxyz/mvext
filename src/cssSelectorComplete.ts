import path from 'path'
import {
  CancellationToken,
  CompletionContext,
  CompletionItem,
  CompletionItemKind,
  CompletionItemProvider,
  Position,
  TextDocument,
  languages,
  workspace,
  type Disposable,
} from 'vscode'
import { mergeIterables as mergeIterable } from './util'

export class CssSelectorCompleteProvider
  implements CompletionItemProvider, Disposable
{
  static readonly reMarkupClassName = /(?<=\bclass(?:Name)?=")[^"]+/g
  static readonly reCssClassName = /^(?:\s*\.)\S+/gm
  static readonly reCssSelectorLine = /^\s*[-.:#,>+~()[\]]/
  static readonly markupLangIds = [
    'vue',
    'mdx',
    'html',
    'svelte',
    'javascript',
    'typescript',
    'javascriptreact',
    'typescriptreact',
  ]
  static readonly cssLangIds = ['css', 'scss', 'tailwindcss']
  dispose: () => void

  constructor() {
    this.dispose = languages.registerCompletionItemProvider(
      CssSelectorCompleteProvider.markupLangIds.concat(
        CssSelectorCompleteProvider.cssLangIds,
      ),
      this,
      '.',
    ).dispose
  }

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
    // if (context.triggerKind !== CompletionTriggerKind.TriggerCharacter) {
    //   return
    // }

    const line = document.lineAt(position)
    switch (true) {
      case position.character - line.firstNonWhitespaceCharacterIndex > 21:
      case !CssSelectorCompleteProvider.reCssSelectorLine.test(
        line.text.slice(0, position.character),
      ):
        return
      case CssSelectorCompleteProvider.markupLangIds.includes(
        document.languageId,
      ):
        return CssSelectorCompleteProvider.mergeResults(
          CssSelectorCompleteProvider.getDocumentClasses(
            document.getText(),
            'markup',
          ),
        )
      case CssSelectorCompleteProvider.cssLangIds.includes(document.languageId):
        return CssSelectorCompleteProvider.mergeResults(
          CssSelectorCompleteProvider.getDocumentClasses(
            document.getText(),
            'css',
          ),
        )
    }

    return CssSelectorCompleteProvider.mergeResults(
      await CssSelectorCompleteProvider.getRelativeDirClasses(document, token),
    )
  }

  static *getDocumentClasses(docText: string, kind: 'markup' | 'css') {
    for (const [text] of docText.matchAll(
      this[kind === 'markup' ? 'reMarkupClassName' : 'reCssClassName'],
    )) {
      yield* text.split(' ')
    }
  }

  static async mergeResults(iterable: Iterable<string>) {
    const classSet = new Set<string>()
    for (const className of iterable) {
      classSet.add(className)
    }
    return Array.from(
      classSet,
      (className) => new CompletionItem(className, CompletionItemKind.Constant),
    )
  }

  static async getRelativeDirClasses(
    document: TextDocument,
    token: CancellationToken,
  ) {
    const baseDir = workspace.getWorkspaceFolder(document.uri)
      ? ''
      : path
          .join(workspace.asRelativePath(document.uri, false), '../')
          .replaceAll('\\', '/')
    const fileMap = {
      markup: '**/*.{html,vue,tsx,jsx,svelte}',
      css: '**/*.{css,scss}',
    }
    const { readFile } = workspace.fs
    const iterableMap: Record<string, Iterable<string>[]> = {}
    for (const [kind, pattern] of Object.entries(fileMap)) {
      iterableMap[kind] = await Promise.all<Iterable<string>>(
        await workspace
          .findFiles(baseDir + pattern, undefined, 20, token)
          .then(function* (files) {
            for (const file of files) {
              yield readFile(file).then((r) =>
                CssSelectorCompleteProvider.getDocumentClasses(
                  r.toString(),
                  kind as any,
                ),
              )
            }
          }),
      )
    }
    return mergeIterable(
      mergeIterable<Iterable<string>>(Object.values(iterableMap)),
    )
  }
}
