/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  commands,
  EventEmitter,
  MarkdownString,
  ThemeColor,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
  window,
  type CancellationToken,
  type Event,
  type ExtensionContext,
  type ProviderResult,
  type TreeDataProvider,
} from 'vscode'
import { Node, type Tree } from 'web-tree-sitter'
import {
  getParseCallback,
  nodeRangeToString,
  nodeToRange,
  TSParser,
} from './util/tsParser'

class RunListTreeDataProvier implements TreeDataProvider<Node> {
  private readonly parser = TSParser.parsers.css
  private tree: Tree
  private _onDidChangeTreeData = new EventEmitter<Node[] | undefined>()
  constructor() {
    this.tree = this.parser.parse(
      getParseCallback(window.activeTextEditor!.document),
    )!
  }
  refresh() {
    this.tree = this.parser.parse(
      getParseCallback(window.activeTextEditor!.document),
    )!
    this._onDidChangeTreeData.fire(undefined)
  }
  onDidChangeTreeData: Event<Node | Node[] | null | undefined> | undefined =
    this._onDidChangeTreeData.event
  getTreeItem(element: Node): TreeItem | Thenable<TreeItem> {
    const item = new TreeItem(
      element.grammarType,
      element.childCount && TreeItemCollapsibleState.Expanded,
    )
    item.id = '' + element.id
    item.iconPath = new ThemeIcon(
      element.isError
        ? 'error'
        : element.isNamed
          ? 'symbol-field'
          : 'symbol-text',
    )
    item.description = nodeRangeToString(element)
    return item
  }
  getChildren(element?: Node): ProviderResult<Node[]> {
    if (!element) {
      return [this.tree.rootNode]
    }
    return element.children as Node[]
  }
  getParent(element: Node): ProviderResult<Node> {
    return element.parent
  }
  resolveTreeItem(
    item: TreeItem,
    element: Node,
    token: CancellationToken,
  ): ProviderResult<TreeItem> {
    item.tooltip = new MarkdownString().appendCodeblock(element.text, 'css')
    return item
  }
}

const runListDecorationType = window.createTextEditorDecorationType({
  border: '1px solid',
  borderColor: new ThemeColor('editor.selectionHighlightBorder'),
  backgroundColor: new ThemeColor('editor.selectionBackground'),
})

export function registerRunList(context: ExtensionContext) {
  const provider = new RunListTreeDataProvier()
  const view = window.createTreeView('mvext.runList', {
    treeDataProvider: provider,
  })
  context.subscriptions.push(
    commands.registerCommand(
      'mvext.refreshRunList',
      provider.refresh.bind(provider),
    ),
    view,
    view.onDidChangeVisibility((e) => e.visible && provider.refresh()),
    view.onDidChangeSelection(async ({ selection: [node] }) => {
      const range = nodeToRange(node)
      window.activeTextEditor!.revealRange(range)
      window.activeTextEditor!.setDecorations(runListDecorationType, [
        {
          range,
          hoverMessage: `${node.grammarType} at ${node.startPosition.row}:${node.startPosition.column}`,
        },
      ])
    }),
  )
}
