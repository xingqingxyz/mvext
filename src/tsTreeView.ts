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
  getParser,
  nodeRangeToString,
  nodeToRange,
  type TSLanguageId,
} from './util/tsParser'

class TSTreeDataProvier implements TreeDataProvider<Node> {
  private tree?: Tree
  private _onDidChangeTreeData = new EventEmitter<Node[] | undefined>()
  async refresh() {
    const { document } = window.activeTextEditor!
    this.tree = (await getParser(document.languageId as TSLanguageId)).parse(
      getParseCallback(document),
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
    return this.tree
      ? element
        ? (element.children as Node[])
        : [this.tree.rootNode]
      : []
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

const tsTreeViewDT = window.createTextEditorDecorationType({
  border: '1px solid yellow',
  backgroundColor: new ThemeColor('editor.selectionBackground'),
})

export function registerTSTreeView(context: ExtensionContext) {
  const provider = new TSTreeDataProvier()
  const view = window.createTreeView('mvext.tsTreeView', {
    treeDataProvider: provider,
  })
  context.subscriptions.push(
    commands.registerCommand(
      'mvext.refreshTSTreeView',
      provider.refresh.bind(provider),
    ),
    view,
    view.onDidChangeVisibility((e) => e.visible && provider.refresh()),
    view.onDidChangeSelection(async ({ selection: [node] }) => {
      const range = nodeToRange(node)
      window.activeTextEditor!.revealRange(range)
      window.activeTextEditor!.setDecorations(tsTreeViewDT, [
        {
          range,
          hoverMessage: `${node.grammarType} at ${node.startPosition.row}:${node.startPosition.column}`,
        },
      ])
    }),
  )
}
