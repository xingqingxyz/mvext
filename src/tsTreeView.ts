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
  type TextDocument,
  type TreeDataProvider,
} from 'vscode'
import { Node, type Tree } from 'web-tree-sitter'
import {
  getParsedTree,
  nodeToRange,
  positionToPoint,
  type TSLanguageId,
} from './tsParser'

class TSTreeDataProvier implements TreeDataProvider<Node> {
  private document?: TextDocument
  private tree?: Tree | null
  private root?: Node // tree.rootNode is not memorized
  private languageId?: TSLanguageId
  //#region api
  private _onDidChangeTreeData = new EventEmitter<Node[] | undefined>()
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
    return item
  }
  getChildren(element?: Node): ProviderResult<Node[]> {
    return element ? (element.children as Node[]) : this.root && [this.root]
  }
  getParent(element: Node): ProviderResult<Node> {
    return element.parent
  }
  resolveTreeItem(item: TreeItem, element: Node): ProviderResult<TreeItem> {
    item.tooltip = new MarkdownString()
      .appendCodeblock(element.text, this.languageId)
      .appendMarkdown(
        `---\n**${element.parent?.fieldNameForChild(
          element.parent?.children.findIndex((n) => n!.equals(element)),
        )}**: \`${element.grammarType}\``,
      )
    return item
  }
  //#endregion
  async showDocument() {
    if (this.document) {
      await window.showTextDocument(this.document)
    }
  }
  refresh() {
    const document = window.activeTextEditor?.document
    if (!document) {
      return
    }
    this.document = document
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
    commands.registerCommand('mvext.tsTreeViewShowDocument', () =>
      provider.showDocument(),
    ),
    commands.registerCommand(
      'mvext.tsTreeViewReveal',
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
    commands.registerCommand('mvext.tsTreeViewRefresh', () =>
      provider.refresh(),
    ),
    view,
    tsTreeViewDT,
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
  )
}
