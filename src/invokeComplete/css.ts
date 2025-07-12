/* eslint-disable @typescript-eslint/no-unused-vars */
import { positionToPoint, tsParser } from '@/util/tsParser'
import {
  CompletionItemKind,
  MarkdownString,
  Position,
  Range,
  workspace,
  type CancellationToken,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type ExtensionContext,
  type ProviderResult,
  type TextDocument,
} from 'vscode'
import {
  Node,
  type ParseCallback,
  type Point,
  type Tree,
} from 'web-tree-sitter'

export class CssCompleteProvider implements CompletionItemProvider {
  private readonly treeMap = new WeakMap<TextDocument, Tree | null>()
  private readonly languageIds = Object.freeze([
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
      workspace.onDidOpenTextDocument((document) => {
        if (document.languageId !== 'css') {
          return
        }
        this.treeMap.set(
          document,
          tsParser.parse(this.getParseCallback(document)),
        )
      }),
      workspace.onDidChangeTextDocument((e) => {
        if (e.document.languageId !== 'css') {
          return
        }
        const tree =
          this.treeMap.get(e.document) ??
          tsParser.parse(this.getParseCallback(e.document))!
        this.treeMap.set(e.document, tree)
        e.contentChanges.forEach((cc) => {
          const lines = (
            e.document.getText(
              new Range(cc.range.start.with(undefined, 0), cc.range.start),
            ) + cc.text
          ).split('\r\n'.slice(2 - e.document.eol))
          tree.edit({
            newEndIndex: cc.rangeOffset + cc.text.length,
            newEndPosition: {
              row: cc.range.start.line + lines.length - 1,
              column: lines.at(-1)!.length,
            },
            startIndex: cc.rangeOffset,
            oldEndIndex: cc.rangeOffset + cc.rangeLength,
            oldEndPosition: positionToPoint(cc.range.end),
            startPosition: positionToPoint(cc.range.start),
          })
        })
      }),
    )
  }
  getParseCallback(document: TextDocument): ParseCallback {
    return (index: number | Range, position: Point) =>
      position.row < document.lineCount
        ? document
            .getText(document.lineAt(position.row).rangeIncludingLineBreak)
            .slice(position.column)
        : undefined
  }
  provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (!this.languageIds.includes(document.languageId)) {
      return
    }
    const range = document.getWordRangeAtPosition(position)
    if (!range) {
      return
    }
    const needle = document.getText(range)
    const tree = tsParser.parse(
      this.getParseCallback(document),
      this.treeMap.get(document),
    )
    if (!tree) {
      return
    }
    this.treeMap.set(document, tree)
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
          data: {
            document,
            startLine: node.startPosition.row,
          },
        }) as CompletionItem,
    )
  }
  resolveCompletionItem(
    item: CompletionItem & {
      data: {
        document: TextDocument
        startLine: number
      }
    },
    token: CancellationToken,
  ): ProviderResult<CompletionItem> {
    item.documentation = new MarkdownString(
      '```css\n' +
        item.data.document.lineAt(item.data.startLine).text +
        '\n```',
    )
    return item
  }
}
