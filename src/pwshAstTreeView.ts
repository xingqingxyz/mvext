import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import {
  commands,
  EventEmitter,
  MarkdownString,
  Position,
  Range,
  ThemeColor,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
  window,
  type Disposable,
  type ExtensionContext,
  type ProviderResult,
  type TextDocument,
  type TreeDataProvider,
} from 'vscode'
import { getExtConfig } from './config'
import { noop } from './util'

const enum NodeType {
  Ast,
  Token,
  TokensChild,
}

interface Ast {
  parent?: Ast
  readonly id: string
  readonly type: NodeType.Ast
  readonly children: Ast[]
  readonly fieldName: string
  readonly typeName: string
  readonly meta: Readonly<Record<string, unknown>>
  readonly range: [number, number, number, number]
  readonly tokens: TokensChild
}

interface Token {
  readonly type: NodeType.Token
  readonly range: [number, number, number, number]
  readonly Kind: string
  readonly TokenFlags: string
  readonly HasError: boolean
}

interface TokensChild {
  readonly id: string
  readonly type: NodeType.TokensChild
  readonly indexes: number[]
}

type Node = Ast | Token | TokensChild

class AstNodeGrabber implements Disposable {
  private shell!: ChildProcessWithoutNullStreams
  private running = false
  private cancel: () => void = noop
  private startServer() {
    this.shell = spawn('pwsh', [this.scriptPath])
  }
  restartServer() {
    this.shell.kill()
    this.startServer()
  }
  dispose = () => this.shell.kill()
  constructor(private scriptPath: string) {
    this.startServer()
    this.shell.stdout.setEncoding('utf8')
    this.shell.on('exit', () =>
      window
        .showErrorMessage(
          'PowerShell ast parser process exited, should restart it?',
          'Restart',
          'Cancel',
        )
        .then((value) => value === 'Restart' && this.startServer()),
    )
  }
  async send(text: string) {
    if (!this.shell.stdin.write(`${text.length}\n${text}`)) {
      throw 'cannot write to pwsh subprocess'
    }
    if (this.running) {
      this.cancel()
    }
    this.running = true
    return await new Promise<string>((resolve, reject) => {
      let length = -1
      let text = ''
      const collect = (data: string) => {
        if (length === -1) {
          length = +data.slice(0, data.indexOf('\n'))
          data = data.slice(data.indexOf('\n') + 1)
        }
        text += data
        console.log(`Received length ${text.length}/${length}`)
        if (text.length === length) {
          resolve(text)
          this.running = false
          this.shell.off('data', collect)
          clearTimeout(timer)
        }
      }
      this.shell.stdout.on('data', collect)
      const timer = setTimeout(() => {
        reject('pwsh ast parse timeout')
      }, 60000)
      this.cancel = () => {
        reject('canceled')
        this.shell.off('data', collect)
        clearTimeout(timer)
      }
    })
  }
}

function rangeValues(range: Range) {
  return [
    range.start.line,
    range.start.character,
    range.end.line,
    range.end.character,
  ] as const
}

function rangeContains(
  r0: readonly [number, number, number, number],
  r1: readonly [number, number, number, number],
) {
  return (
    (r0[0] < r1[0] || (r0[0] === r1[0] && r0[1] <= r1[1])) &&
    (r0[2] > r1[2] || (r0[2] === r1[2] && r0[3] >= r1[3]))
  )
}

export class PwshAstTreeDataProvier
  implements TreeDataProvider<Node>, Disposable
{
  //#region api
  private _onDidChangeTreeData = new EventEmitter<Node[] | undefined>()
  onDidChangeTreeData = this._onDidChangeTreeData.event
  dispose() {
    this.sender.dispose()
  }
  getTreeItem(element: Node): TreeItem | Thenable<TreeItem> {
    let item
    switch (element.type) {
      case NodeType.Ast:
        item = new TreeItem(
          element.fieldName,
          element === this.root
            ? TreeItemCollapsibleState.Expanded
            : TreeItemCollapsibleState.Collapsed,
        )
        item.id = element.id
        item.description = element.typeName
        item.iconPath = new ThemeIcon('symbol-field')
        break
      case NodeType.Token:
        item = new TreeItem(element.Kind)
        item.id = this.id++ + 't'
        item.description = element.TokenFlags
        item.iconPath = new ThemeIcon(
          element.HasError ? 'error' : 'symbol-value',
        )
        break
      case NodeType.TokensChild:
        item = new TreeItem('tokens', TreeItemCollapsibleState.Collapsed)
        item.id = element.id
        item.iconPath = new ThemeIcon('symbol-parameter')
        break
    }
    return item
  }
  getChildren(element?: Node): ProviderResult<Node[]> {
    if (!element) {
      return this.root ? [this.root] : []
    }
    switch (element.type) {
      case NodeType.Ast:
        return (element.children as Node[]).concat(element.tokens)
      case NodeType.TokensChild:
        return element.indexes.map((i) => this.tokens[i])
    }
  }
  getParent(element: Node): ProviderResult<Node> {
    return (element as Ast).parent
  }
  resolveTreeItem(item: TreeItem, element: Node): ProviderResult<TreeItem> {
    switch (element.type) {
      case NodeType.Ast:
        item.tooltip = new MarkdownString().appendCodeblock(
          this.document!.getText(new Range(...element.range)),
          'powershell',
        )
        if (element.meta) {
          item.tooltip
            .appendMarkdown('---')
            .appendCodeblock(JSON.stringify(element.meta, undefined, 2), 'json')
        }
        break
      case NodeType.Token:
        item.tooltip = new MarkdownString().appendCodeblock(
          this.document!.getText(new Range(...element.range)),
          'powershell',
        )
        break
    }
    return item
  }
  //#endregion
  private id = 0
  private sender: AstNodeGrabber
  private document?: TextDocument
  private root?: Ast
  private tokens: Token[] = []
  private view = window.createTreeView('mvext.pwshAstTreeView', {
    treeDataProvider: this,
  })
  private treeViewDT = window.createTextEditorDecorationType({
    border: '1px solid yellow',
    backgroundColor: new ThemeColor('editor.selectionBackground'),
  })
  constructor(context: ExtensionContext) {
    this.sender = new AstNodeGrabber(
      context.asAbsolutePath('resources/serveAstNode.ps1'),
    )
    context.subscriptions.push(
      this,
      this.view,
      this.treeViewDT,
      commands.registerCommand('mvext.pwshAstTreeViewOpen', this.open),
      commands.registerCommand('mvext.pwshAstTreeViewReveal', this.reveal),
      commands.registerCommand('mvext.pwshAstTreeViewRefresh', this.refresh),
      this.view.onDidChangeVisibility((e) =>
        e.visible
          ? this.refresh()
          : window.activeTextEditor!.setDecorations(this.treeViewDT, []),
      ),
      this.view.onDidChangeSelection(async ({ selection }) => {
        if (selection.length) {
          switch (selection[0].type) {
            case NodeType.TokensChild:
              return
          }
          const editor = window.activeTextEditor!
          const range = new Range(...selection[0].range)
          editor.revealRange(range)
          editor.setDecorations(this.treeViewDT, [{ range }])
        }
      }),
    )
  }
  private getNodeAtRange(range: Range) {
    const rv = rangeValues(range)
    const dfs = (root: Ast): Ast | undefined => {
      if (!rangeContains(root.range, rv)) {
        return
      }
      for (const child of root.children) {
        const node = dfs(child)
        if (node) {
          child.parent = root
          return node
        }
      }
      return root
    }
    return dfs(this.root!)!
  }
  open = () => this.document && window.showTextDocument(this.document)
  refresh = async () => {
    const document = window.activeTextEditor?.document
    if (document?.languageId !== 'powershell') {
      return
    }
    if (
      document.offsetAt(new Position(document.lineCount, 0)) >
      getExtConfig('pwshAstTreeView.noProcessSize')
    ) {
      return window.showWarningMessage(
        'PowerShell ast tree view not processed: size exceeds.',
      )
    }
    this.document = document
    await window
      .withProgress({ location: { viewId: 'mvext.pwshAstTreeView' } }, () =>
        this.sender.send(document.getText()).then((text) => {
          const tree: {
            root: Ast
            tokens: Token[]
          } = JSON.parse(text)
          this.root = tree.root
          this.tokens = tree.tokens
          this._onDidChangeTreeData.fire(undefined)
        }),
      )
      .then(undefined, (e) => window.showErrorMessage(e + ''))
  }
  reveal = () => (
    this.view.visible || this.refresh(),
    this.view.reveal(this.getNodeAtRange(window.activeTextEditor!.selection), {
      expand: true,
    })
  )
}
