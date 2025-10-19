import {
  commands,
  env,
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
import { getParsedTree, nodeToRange, positionToPoint } from './tsParser'

export class TSTreeDataProvier implements TreeDataProvider<Node> {
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
    if (element.parent) {
      const index = element.parent.children.findIndex((n) => n!.equals(element))
      item.description = element.parent.fieldNameForChild(index) ?? `[${index}]`
    }
    item.id = element.id + ''
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
      .appendCodeblock(element.text, this.document!.languageId)
      .appendMarkdown(`---\n**grammarType**: \`${element.grammarType}\``)
    return item
  }
  //#endregion
  private document?: TextDocument
  private tree?: Tree | null
  private root?: Node // tree.rootNode is not memorized
  private view = window.createTreeView('mvext.tsTreeView', {
    treeDataProvider: this,
  })
  private treeViewDT = window.createTextEditorDecorationType({
    border: '1px solid yellow',
    backgroundColor: new ThemeColor('editor.selectionBackground'),
  })
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      this.view,
      this.treeViewDT,
      commands.registerCommand('mvext.tsTreeViewOpen', this.open),
      commands.registerCommand('mvext.tsTreeViewReveal', this.reveal),
      commands.registerCommand('mvext.tsTreeViewRefresh', this.refresh),
      commands.registerCommand('mvext.tsTreeViewCopy', this.copy),
      this.view.onDidChangeVisibility((e) =>
        e.visible
          ? this.refresh()
          : window.activeTextEditor!.setDecorations(this.treeViewDT, []),
      ),
      this.view.onDidChangeSelection(async ({ selection: [node] }) => {
        if (node) {
          const range = nodeToRange(node)
          const editor = window.activeTextEditor!
          editor.revealRange(range)
          editor.setDecorations(this.treeViewDT, [{ range }])
        }
      }),
    )
  }
  private getNodeAtRange(range: Range) {
    return this.tree!.rootNode.descendantForPosition(
      positionToPoint(range.start),
      positionToPoint(range.end),
    )!
  }
  copy = (element: Node) => {
    const items = []
    while (element.parent) {
      const index = element.parent.children.findIndex((n) => n!.equals(element))
      const fieldName = element.parent.fieldNameForChild(index)
      items.push(
        fieldName
          ? `.childForFieldName(${JSON.stringify(fieldName)})`
          : `.child(${index})`,
      )
      element = element.parent
    }
    return env.clipboard.writeText(items.reverse().join(''))
  }
  open = () => this.document && window.showTextDocument(this.document)
  refresh = () => {
    const document = window.activeTextEditor?.document
    if (!document) {
      return
    }
    const tree = getParsedTree(document)
    if (!tree) {
      return
    }
    this.document = document
    this.tree = tree
    this.root = this.tree?.rootNode
    this._onDidChangeTreeData.fire(undefined)
  }
  reveal = () => (
    this.view.visible || this.refresh(),
    this.view.reveal(this.getNodeAtRange(window.activeTextEditor!.selection), {
      expand: true,
    })
  )
}
