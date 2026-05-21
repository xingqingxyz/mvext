import { getParsedTree } from '@/components/treeSitter/parser'
import {
  CompletionItemKind,
  CompletionTriggerKind,
  languages,
  Position,
  type CancellationToken,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type CompletionList,
  type ExtensionContext,
  type TextDocument,
} from 'vscode'
import type { Node } from 'web-tree-sitter'

export class CSSCompletionItemProvider implements CompletionItemProvider {
  private static readonly languageIds = Object.freeze([
    'css',
    'scss',
    'html',
    'vue',
    'svelte',
    'javascriptreact',
    'typescriptreact',
  ])
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerCompletionItemProvider(
        [
          {
            pattern: '**',
            scheme: 'file',
          },
          {
            pattern: '**',
            scheme: 'untitled',
          },
          {
            pattern: '**',
            scheme: 'vscode-vfs',
          },
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
  ) {
    if (
      context.triggerKind !==
      CompletionTriggerKind.TriggerForIncompleteCompletions
    ) {
      return { isIncomplete: true } as CompletionList
    }
    if (!CSSCompletionItemProvider.languageIds.includes(document.languageId)) {
      return
    }
    const range = document.getWordRangeAtPosition(position)
    const tree = getParsedTree(document)
    if (!(range && tree)) {
      return
    }
    const needle = document.getText(range)
    const nodes = tree.rootNode.descendantsOfType(
      document.languageId.endsWith('css') ? 'class_selector' : 'class_name',
    ) as Node[]
    const nodeSet = new Set<Node>()
    for (const node of nodes) {
      if (node.text.includes(needle)) {
        nodeSet.add(node)
      }
    }
    return Array.from(
      nodeSet,
      (node) =>
        ({
          label: node.text,
          kind: CompletionItemKind.Keyword,
          sortText: '10',
          detail: `${document.fileName}:${node.startPosition.row}:${node.startPosition.column}`,
        }) as CompletionItem,
    )
  }
}
