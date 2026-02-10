import { getExtConfig } from '@/config'
import {
  commands,
  env,
  EventEmitter,
  MarkdownString,
  Position,
  Range,
  ThemeColor,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
  window,
  type ExtensionContext,
  type ProviderResult,
  type TextDocument,
  type TreeDataProvider,
} from 'vscode'
import {
  powershellExtension,
  registerPowershellExtension,
  requestEditorCommand,
} from '.'

interface Ast {
  parent?: Ast
  tokens?: Token[]
  readonly Id: string
  readonly Children: Ast[]
  readonly FieldName: string
  readonly Meta: Readonly<Record<string, unknown>>
  readonly Range: [number, number, number, number]
  readonly TypeName: string
}

interface Token {
  readonly HasError: boolean
  readonly Kind: string
  readonly Range: [number, number, number, number]
  readonly TokenFlags: string
}

interface AstTree {
  Root: Ast
  Tokens: Token[]
}

type Node = Ast | Token

function rangeValues(range: Range) {
  return [
    range.start.line,
    range.start.character,
    range.end.line,
    range.end.character,
  ] as [number, number, number, number]
}

function rangeContains(
  r0: [number, number, number, number],
  r1: [number, number, number, number],
) {
  return (
    (r0[0] < r1[0] || (r0[0] === r1[0] && r0[1] <= r1[1])) &&
    (r0[2] > r1[2] || (r0[2] === r1[2] && r0[3] >= r1[3]))
  )
}

export class PwshAstTreeDataProvier implements TreeDataProvider<Node> {
  //#region api
  private _onDidChangeTreeData = new EventEmitter<Node[] | undefined>()
  onDidChangeTreeData = this._onDidChangeTreeData.event
  getTreeItem(element: Node): TreeItem | Thenable<TreeItem> {
    let item
    if ('Meta' in element) {
      item = new TreeItem(
        element.FieldName,
        element === this.tree!.Root
          ? TreeItemCollapsibleState.Expanded
          : TreeItemCollapsibleState.Collapsed,
      )
      item.id = element.Id
      item.description = element.TypeName
      item.iconPath = new ThemeIcon('symbol-field')
    } else {
      item = new TreeItem(element.Kind)
      item.id = this.tokenIdPrefix + this.tokenId++
      item.description = this.document!.getText(new Range(...element.Range))
      item.iconPath = new ThemeIcon(element.HasError ? 'error' : 'symbol-value')
    }
    return item
  }
  getChildren(element?: Node): ProviderResult<Node[]> {
    if (!element) {
      if (this.tree) {
        return [this.tree.Root]
      }
    } else if ('Meta' in element) {
      return (element.Children as Node[]).concat(element.tokens ?? [])
    }
  }
  getParent(element: Node): ProviderResult<Node> {
    return (element as Ast).parent
  }
  resolveTreeItem(item: TreeItem, element: Node): ProviderResult<TreeItem> {
    if ('Meta' in element) {
      item.tooltip = new MarkdownString().appendCodeblock(
        this.document!.getText(new Range(...element.Range)),
        'powershell',
      )
      item.tooltip
        .appendMarkdown('---')
        .appendCodeblock(JSON.stringify(element.Meta, undefined, 2), 'json')
    } else {
      item.tooltip = `[${this.tree!.Tokens.indexOf(element)}]: ${element.Range.join(' ')}`
    }
    return item
  }
  //#endregion
  private tokenIdPrefix!: string
  private tokenId!: number
  private document?: TextDocument
  private documentVersion = 0
  private tree?: AstTree
  private view = window.createTreeView('mvext.pwsh.astTreeView', {
    treeDataProvider: this,
  })
  private treeViewDT = window.createTextEditorDecorationType({
    border: '1px solid yellow',
    backgroundColor: new ThemeColor('editor.selectionBackground'),
  })
  constructor(private context: ExtensionContext) {
    context.subscriptions.push(
      this.view,
      this.treeViewDT,
      commands.registerCommand('mvext.pwsh.astTreeViewOpen', this.open),
      commands.registerCommand('mvext.pwsh.astTreeViewReveal', this.reveal),
      commands.registerCommand('mvext.pwsh.astTreeViewRefresh', this.refresh),
      commands.registerCommand('mvext.pwsh.astTreeViewSend', this.send),
      commands.registerCommand('mvext.pwsh.astTreeViewCopy', this.copy),
      this.view.onDidChangeSelection(({ selection: [element] }) => {
        if (!element || window.activeTextEditor?.document !== this.document!) {
          return
        }
        const range = new Range(...element.Range)
        window.activeTextEditor.revealRange(range)
        window.activeTextEditor.setDecorations(this.treeViewDT, [{ range }])
        if ('Meta' in element && !element.tokens) {
          element.tokens = this.getTokens(element)
          // next calls getChildren, then getTreeItem
          this.tokenIdPrefix = element.Id + '-'
          this.tokenId = 0
          this._onDidChangeTreeData.fire([element])
        }
      }),
    )
  }
  private getNodeAtRange(range: [number, number, number, number]) {
    const dfs = (root: Ast): Ast | undefined => {
      if (!rangeContains(root.Range, range)) {
        return
      }
      for (const child of root.Children) {
        const node = dfs(child)
        if (node) {
          child.parent = root
          return node
        }
      }
      return root
    }
    return dfs(this.tree!.Root)!
  }
  private getTokens(element: Ast) {
    const { Range } = element
    const { Tokens } = this.tree!
    const { length } = Tokens
    let i = 0
    while (Tokens[i].Range[0] < Range[0] && ++i < length) {}
    while (
      Tokens[i].Range[0] === Range[0] &&
      Tokens[i].Range[1] < Range[1] &&
      ++i < length
    ) {}
    const s = i++
    while (Tokens[i].Range[2] < Range[2] && ++i < length) {}
    while (
      Tokens[i].Range[2] === Range[2] &&
      Tokens[i].Range[3] <= Range[3] &&
      ++i < length
    ) {}
    return Tokens.slice(s, i)
  }
  private getPath(element: Node) {
    if ('Meta' in element) {
      if (!element.parent) {
        // traverse all elements cover this, even child of this
        this.getNodeAtRange(element.Range)
      }
      const items = []
      while (element.parent) {
        items.push('.' + element.FieldName)
        element = element.parent
      }
      return items.reverse().join('')
    }
    return `[${this.tree!.Tokens.indexOf(element)}]`
  }
  send = async (element: Node) => {
    const text =
      '$psEditor.GetEditorContext().CurrentFile.' +
      ('Meta' in element ? 'Ast' : 'Tokens') +
      this.getPath(element)
    await commands.executeCommand('PowerShell.ShowSessionConsole')
    window.activeTerminal!.sendText(text, false)
  }
  copy = (element: Node) => env.clipboard.writeText(this.getPath(element))
  open = () => this.document && window.showTextDocument(this.document)
  refresh = async () => {
    const document = window.activeTextEditor?.document
    if (
      document?.languageId !== 'powershell' ||
      (document === this.document && document.version === this.documentVersion)
    ) {
      return
    }
    if (
      document.offsetAt(new Position(document.lineCount, 0)) >
      getExtConfig('pwsh.astTreeView.noProcessSize')
    ) {
      await window.showWarningMessage(
        'PowerShell ast tree view not processed: size exceeds.',
      )
      return
    }
    if (!powershellExtension) {
      await registerPowershellExtension(this.context)
    }
    await window.withProgress(
      { location: { viewId: 'mvext.pwsh.astTreeView' } },
      () =>
        requestEditorCommand<AstTree>('mvext.sendAstTreeJson').then((tree) => {
          this.tree = tree
          this.document = document
          this.documentVersion = document.version
          this._onDidChangeTreeData.fire(undefined)
        }),
    )
  }
  reveal = async () => {
    await this.refresh()
    this.view.reveal(
      this.getNodeAtRange(rangeValues(window.activeTextEditor!.selection)),
      {
        expand: true,
      },
    )
  }
}
