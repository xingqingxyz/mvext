import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import {
  commands,
  env,
  EventEmitter,
  MarkdownString,
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

class AstNodeGrabber implements Disposable {
  private shell!: ChildProcessWithoutNullStreams
  private startServer() {
    this.shell = spawn('pwsh', [
      extContext.asAbsolutePath('resources/serveAstNode.ps1'),
    ])
  }
  restartServer() {
    this.shell.kill()
    this.startServer()
  }
  dispose = () => this.shell.kill()
  constructor() {
    this.startServer()
    this.shell.stdout.setEncoding('utf8')
    this.shell.on('exit', () => {
      window
        .showErrorMessage(
          'PowerShell ast parser process exited, should restart it?',
          'Restart',
          'Cancel',
        )
        .then((value) => value === 'Restart' && this.startServer())
    })
  }
  async send(text: string) {
    if (!this.shell.stdin.write(`${text.length}\n${text}`)) {
      throw 'cannot write into ps1 subprocess'
    }
    return await new Promise<string>((resolve, reject) => {
      let length = -1
      let text = ''
      const collect = (data: string) => {
        if (length === -1) {
          length = +data.slice(0, data.indexOf('\n'))
          console.log(`Receiving length ${length}`)
          data = data.slice(data.indexOf('\n') + 1)
        }
        console.log(`Received length ${data.length}`)
        text += data
        if (text.length === length) {
          clearTimeout(timer)
          this.shell.off('data', collect)
          resolve(text)
        }
      }
      this.shell.stdout.on('data', collect)
      const timer = setTimeout(() => {
        reject('ast parse timeout')
      }, 60000)
    })
  }
}

type AstType = ''

interface AstNode {
  get parent(): AstNode | undefined
  get range(): Range
  readonly _parentMap: ReadonlyMap<AstNode, AstNode>
  readonly _range: [number, number, number, number]
  readonly startOffset: number
  readonly endOffset: number
  readonly type: AstType
  readonly children: AstNode[]
}

function rangeToString(range: [number, number, number, number]) {
  return `[${range[0]}, ${range[1]}] - [${range[2]}, ${range[3]}]`
}

class AstTree {
  private readonly _parentMap = new Map<AstNode, AstNode | undefined>()
  private readonly AstNodeProto = {
    _parentMap: this._parentMap as ReadonlyMap<AstNode, AstNode>,
    get parent(): AstNode | undefined {
      return this._parentMap.get(this)
    },
    get range(): Range {
      return new Range(...this._range)
    },
  } as AstNode
  constructor(public root: AstNode) {
    this.visit(root)
  }
  private visit(node: AstNode, parent?: AstNode) {
    Object.setPrototypeOf(node, this.AstNodeProto)
    this._parentMap.set(node, parent)
    for (const child of node.children) {
      this.visit(child, node)
    }
  }
}

class PwshAstTreeDataProvier implements TreeDataProvider<AstNode>, Disposable {
  private sender = new AstNodeGrabber()
  private root?: AstNode
  private document?: TextDocument
  private _onDidChangeTreeData = new EventEmitter<AstNode[] | undefined>()
  onDidChangeTreeData = this._onDidChangeTreeData.event
  dispose() {
    this.sender.dispose()
  }
  restart() {
    this.sender.restartServer()
    void this.refresh()
  }
  private async showDocument() {
    let { document } = window.activeTextEditor!
    if (document.languageId === 'powershell') {
      this.document = document
    } else {
      document = this.document!
    }
    try {
      await window.showTextDocument(document)
    } catch {
      return
    }
    return document
  }
  async refresh() {
    // file maybe deleted
    const document = await this.showDocument()
    if (!document) {
      return
    }
    try {
      this.root = new AstTree(
        JSON.parse(await this.sender.send(document.getText())),
      ).root
    } catch (e) {
      await window.showErrorMessage(e + '')
    }
    this._onDidChangeTreeData.fire(undefined)
  }
  getNodeAtRange(range: Range) {
    const dfs = (node: AstNode): AstNode | undefined => {
      if (node.range.contains(range)) {
        for (const child of node.children) {
          const node = dfs(child)
          if (node) {
            return node
          }
        }
        return node
      }
    }
    return dfs(this.root!)!
  }
  getTreeItem(element: AstNode): TreeItem | Thenable<TreeItem> {
    const item = new TreeItem(
      element.type,
      element.children.length
        ? element === this.root
          ? TreeItemCollapsibleState.Expanded
          : TreeItemCollapsibleState.Collapsed
        : TreeItemCollapsibleState.None,
    )
    item.iconPath = new ThemeIcon('symbol-field')
    item.description = rangeToString(element._range)
    return item
  }
  getChildren(element?: AstNode): ProviderResult<AstNode[]> {
    return element
      ? (element.children as AstNode[])
      : this.root
        ? [this.root]
        : []
  }
  getParent(element: AstNode): ProviderResult<AstNode> {
    return element.parent
  }
  resolveTreeItem(item: TreeItem, element: AstNode): ProviderResult<TreeItem> {
    item.tooltip = new MarkdownString().appendCodeblock(
      this.document!.getText(element.range),
      'powershell',
    )
    return item
  }
}

let extContext: ExtensionContext
export function registerPwshAstTreeView(context: ExtensionContext) {
  extContext = context
  const treeViewDT = window.createTextEditorDecorationType({
    border: '1px solid yellow',
    backgroundColor: new ThemeColor('editor.selectionBackground'),
  })
  const provider = new PwshAstTreeDataProvier()
  const view = window.createTreeView('mvext.pwshAstTreeView', {
    treeDataProvider: provider,
  })
  extContext.subscriptions.push(
    commands.registerCommand('mvext.copyTreeItemLabel', (node: AstNode) =>
      env.clipboard.writeText(node.type),
    ),
    commands.registerCommand('mvext.revealInPwshAstTreeView', () =>
      view.reveal(provider.getNodeAtRange(window.activeTextEditor!.selection), {
        expand: true,
      }),
    ),
    commands.registerCommand('mvext.refreshPwshAstTreeView', () =>
      provider.refresh(),
    ),
    commands.registerCommand('mvext.restartPwshAstTreeView', () =>
      provider.restart(),
    ),
    treeViewDT,
    provider,
    view,
    view.onDidChangeVisibility((e) =>
      e.visible
        ? provider.refresh()
        : window.activeTextEditor!.setDecorations(treeViewDT, []),
    ),
    view.onDidExpandElement((e) => {
      void e
    }),
    view.onDidChangeSelection(async ({ selection }) => {
      if (selection.length) {
        const { range } = selection[0]
        const editor = window.activeTextEditor!
        editor.revealRange(range)
        editor.setDecorations(treeViewDT, [{ range }])
      }
    }),
  )
}
