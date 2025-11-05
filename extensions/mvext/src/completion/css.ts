/* eslint-disable @typescript-eslint/no-unused-vars */
import { getParsedTree } from '@/ts/parser'
import {
  CompletionItemKind,
  Position,
  type CancellationToken,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type TextDocument,
} from 'vscode'
import type { Node } from 'web-tree-sitter'

export class CssCompleteProvider implements CompletionItemProvider {
  private static readonly languageIds = Object.freeze([
    'css',
    'scss',
    'html',
    'vue',
    'svelte',
    'javascriptreact',
    'typescriptreact',
  ])
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (!CssCompleteProvider.languageIds.includes(document.languageId)) {
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
