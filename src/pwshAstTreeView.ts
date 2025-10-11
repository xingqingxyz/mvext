import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import {
  commands,
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
import { noop } from './util'

const enum NodeType {
  AstNode,
  Token,
  AstNodeChild,
  TokensChild,
}

interface AstNode {
  nodeType: NodeType.AstNode
  id: number
  name: string
  parent?: AstNode
  children?: (AstNode | AstNodeChild | TokensChild)[]
  readonly type: string
  readonly range: [number, number, number, number]
  readonly meta?: Readonly<Record<string, unknown>>
  readonly tokens: Token[]
  readonly A: AstNode[]
}

interface AstNodeChild {
  nodeType: NodeType.AstNodeChild
  id: number
  readonly children: undefined
  readonly name: string
}

interface TokensChild {
  nodeType: NodeType.TokensChild
  id: number
  children?: Token[]
  readonly name: string
  readonly parent: AstNode
}

interface Token {
  nodeType: NodeType.Token
  id: number
  readonly children: undefined
  readonly name: string
  readonly TokenFlags: string
  readonly HasError: boolean
  readonly range: [number, number, number, number]
}

type Node = AstNode | Token | AstNodeChild | TokensChild

class AstNodeGrabber implements Disposable {
  private shell!: ChildProcessWithoutNullStreams
  private running = false
  private cancel: () => void = noop
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
        reject('ast parse timeout')
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

class PwshAstTreeDataProvier implements TreeDataProvider<Node>, Disposable {
  private nodeId = 0
  private sender = new AstNodeGrabber()
  private root?: AstNode
  private document?: TextDocument
  //#region api
  private _onDidChangeTreeData = new EventEmitter<Node[] | undefined>()
  onDidChangeTreeData = this._onDidChangeTreeData.event
  dispose() {
    this.sender.dispose()
  }
  getTreeItem(element: Node): TreeItem | Thenable<TreeItem> {
    const item = new TreeItem(element.name)
    item.id = element.id + ''
    switch (element.nodeType) {
      case NodeType.AstNode:
        item.description = element.type
        item.collapsibleState =
          element === this.root
            ? TreeItemCollapsibleState.Expanded
            : TreeItemCollapsibleState.Collapsed
        item.iconPath = new ThemeIcon('symbol-field')
        break
      case NodeType.Token:
        item.description = element.TokenFlags
        item.iconPath = new ThemeIcon(
          element.HasError ? 'error' : 'symbol-value',
        )
        break
      case NodeType.AstNodeChild:
        item.iconPath = new ThemeIcon('list-tree')
        break
      case NodeType.TokensChild:
        item.collapsibleState = TreeItemCollapsibleState.Collapsed
        item.iconPath = new ThemeIcon('symbol-parameter')
        break
    }
    return item
  }
  getChildren(element?: Node): Node[] {
    if (!element) {
      return this.root ? [this.root] : []
    }
    if (element.children) {
      return element.children
    }
    switch (element.nodeType) {
      case NodeType.AstNode:
        return (element.children = (Object.keys(element) as 'A'[])
          .filter((k) => k[0] < 'a')
          .sort()
          .flatMap<AstNode | AstNodeChild | TokensChild>((k) => {
            if (!element[k].length) {
              return {
                id: this.nodeId++,
                name: k,
                nodeType: NodeType.AstNodeChild,
              } as AstNodeChild
            }
            for (const node of element[k]) {
              if (node.id) {
                continue
              }
              node.id = this.nodeId++
              node.name = k
              node.nodeType = NodeType.AstNode
              node.parent = element
            }
            return element[k]
          })
          .concat({
            id: this.nodeId++,
            name: 'tokens',
            nodeType: NodeType.TokensChild,
            parent: element,
          } as TokensChild))
      case NodeType.TokensChild:
        element.children = element.parent.tokens
        for (const child of element.children) {
          child.id = this.nodeId++
          child.nodeType = NodeType.Token
        }
        return element.children
    }
    return []
  }
  getParent(element: Node): ProviderResult<Node> {
    return (element as AstNode).parent
  }
  resolveTreeItem(item: TreeItem, element: Node): ProviderResult<TreeItem> {
    switch (element.nodeType) {
      case NodeType.AstNode:
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
  async showDocument() {
    if (this.document) {
      await window.showTextDocument(this.document)
    }
  }
  getNodeAtRange(range: Range) {
    const rv = rangeValues(range)
    const dfs = (root: AstNode): AstNode | undefined => {
      if (!rangeContains(root.range, rv)) {
        return
      }
      for (let node of this.getChildren(root)) {
        if (node.nodeType !== NodeType.AstNode) {
          continue
        }
        if ((node = dfs(node)!)) {
          return node
        }
      }
      return root
    }
    return dfs(this.root!)!
  }
  async refresh() {
    const document = window.activeTextEditor?.document
    if (document?.languageId !== 'powershell') {
      return
    }
    this.document = document
    try {
      const root = JSON.parse(await this.sender.send(document.getText()))
      this.root = root
      root.id = this.nodeId++
      root.name = 'ScriptFile'
      root.nodeType = NodeType.AstNode
      this._onDidChangeTreeData.fire(undefined)
    } catch (e) {
      await window.showErrorMessage(e + '')
    }
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
    commands.registerCommand('mvext.pwshAstTreeViewShowDocument', () =>
      provider.showDocument(),
    ),
    commands.registerCommand(
      'mvext.pwshAstTreeViewReveal',
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
    commands.registerCommand('mvext.pwshAstTreeViewRefresh', () =>
      provider.refresh(),
    ),
    treeViewDT,
    provider,
    view,
    view.onDidChangeVisibility((e) =>
      e.visible
        ? provider.refresh()
        : window.activeTextEditor!.setDecorations(treeViewDT, []),
    ),
    view.onDidChangeSelection(async ({ selection }) => {
      if (selection.length) {
        switch (selection[0].nodeType) {
          case NodeType.AstNodeChild:
          case NodeType.TokensChild:
            return
        }
        const editor = window.activeTextEditor!
        const range = new Range(...selection[0].range)
        editor.revealRange(range)
        editor.setDecorations(treeViewDT, [{ range }])
      }
    }),
  )
}
