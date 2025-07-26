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
import { getExtConfig } from './config'
import {
  getParsedTree,
  nodeRangeToString,
  nodeToRange,
  type TSLanguageId,
} from './tsParser'

class TSTreeDataProvier implements TreeDataProvider<Node> {
  private tree?: Tree | null
  private languageId?: TSLanguageId
  private _onDidChangeTreeData = new EventEmitter<Node[] | undefined>()
  async refresh() {
    const { document } = window.activeTextEditor!
    this.tree = getParsedTree(document)
    this.languageId = document.languageId as TSLanguageId
    if (!getExtConfig('treeSitter.syncedLanguages').includes(this.languageId)) {
      return
    }
    this._onDidChangeTreeData.fire(undefined)
  }
  onDidChangeTreeData: Event<Node | Node[] | null | undefined> | undefined =
    this._onDidChangeTreeData.event
  getTreeItem(element: Node): TreeItem | Thenable<TreeItem> {
    const item = new TreeItem(
      element.type,
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
    item.description = element.grammarType + ' ' + nodeRangeToString(element)
    return item
  }
  getChildren(element?: Node): ProviderResult<Node[]> {
    return this.tree
      ? element
        ? (element.children as Node[])
        : [this.tree.rootNode]
      : []
  }
  resolveTreeItem(
    item: TreeItem,
    element: Node,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    token: CancellationToken,
  ): ProviderResult<TreeItem> {
    item.tooltip = new MarkdownString().appendCodeblock(
      element.text,
      this.languageId,
    )
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
        window.activeTextEditor!.revealRange(range)
        window.activeTextEditor!.setDecorations(tsTreeViewDT, [{ range }])
      }
    }),
  )
}
