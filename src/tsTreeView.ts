import {
  commands,
  EventEmitter,
  MarkdownString,
  ThemeColor,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
  window,
  type Event,
  type ExtensionContext,
  type ProviderResult,
  type Range,
  type TreeDataProvider,
} from 'vscode'
import { Node, type Tree } from 'web-tree-sitter'
import {
  getParsedTree,
  nodeRangeToString,
  nodeToRange,
  positionToPoint,
  type TSLanguageId,
} from './tsParser'

class TSTreeDataProvier implements TreeDataProvider<Node> {
  private tree?: Tree | null
  private root?: Node // tree.rootNode is not memorized
  private languageId?: TSLanguageId
  private _onDidChangeTreeData = new EventEmitter<Node[] | undefined>()
  refresh() {
    const { document } = window.activeTextEditor!
    this.tree = getParsedTree(document)
    this.root = this.tree?.rootNode
    this.languageId = document.languageId as TSLanguageId
    this._onDidChangeTreeData.fire(undefined)
  }
  getNodeAtRange(range: Range) {
    return this.tree!.rootNode.descendantForPosition(
      positionToPoint(range.start),
      positionToPoint(range.end),
    )!
  }
  onDidChangeTreeData: Event<Node | Node[] | null | undefined> | undefined =
    this._onDidChangeTreeData.event
  getTreeItem(element: Node): TreeItem | Thenable<TreeItem> {
    const item = new TreeItem(
      element.type,
      element.childCount
        ? element === this.root
          ? TreeItemCollapsibleState.Expanded
          : TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None,
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
    return element ? (element.children as Node[]) : this.root ? [this.root] : []
  }
  getParent(element: Node): ProviderResult<Node> {
    return element.parent
  }
  resolveTreeItem(item: TreeItem, element: Node): ProviderResult<TreeItem> {
    item.tooltip = new MarkdownString()
      .appendMarkdown(
        `**${element.parent?.fieldNameForChild(
          element.parent?.children.findIndex((n) => n!.equals(element)),
        )}**: \`${element.grammarType}\``,
      )
      .appendCodeblock(element.text, this.languageId)
    return item
  }
}

export function registerTSTreeView(context: ExtensionContext) {
  const provider = new TSTreeDataProvier()
  const view = window.createTreeView('mvext.tsTreeView', {
    treeDataProvider: provider,
  })
  const tsTreeViewDT = window.createTextEditorDecorationType({
    border: '1px solid yellow',
    backgroundColor: new ThemeColor('editor.selectionBackground'),
  })
  context.subscriptions.push(
    commands.registerCommand(
      'mvext.revealInTsTreeView',
      () => (
        view.visible || provider.refresh(),
        view.reveal(
          provider.getNodeAtRange(window.activeTextEditor!.selection),
          {
            expand: true,
          },
        )
      ),
    ),
    commands.registerCommand(
      'mvext.refreshTsTreeView',
      provider.refresh.bind(provider),
    ),
    view,
    view.onDidChangeVisibility((e) =>
      e.visible
        ? provider.refresh()
        : window.activeTextEditor!.setDecorations(tsTreeViewDT, []),
    ),
    view.onDidChangeSelection(async ({ selection: [node] }) => {
      if (node) {
        const range = nodeToRange(node)
        const editor = window.activeTextEditor!
        editor.revealRange(range)
        editor.setDecorations(tsTreeViewDT, [{ range }])
      }
    }),
    tsTreeViewDT,
  )
}
