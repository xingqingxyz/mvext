import { spawn, type ChildProcessWithoutNullStreams } from 'child_process'
import { appendFile } from 'fs/promises'
import { tmpdir } from 'os'
import path from 'path'
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

class AstNodeGrabber implements Disposable {
  private logPath = path.join(tmpdir(), 'mvext-powershell.log')
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
        void appendFile(
          this.logPath,
          `[${new Date().toLocaleString()}] [Server] Received length ${text.length}/${length}`,
          'utf8',
        )
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
    if ('Id' in element) {
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
      return this.tree ? [this.tree.Root] : []
    }
    if ('Id' in element) {
      return (element.Children as Node[]).concat(element.tokens ?? [])
    }
  }
  getParent(element: Node): ProviderResult<Node> {
    return (element as Ast).parent
  }
  resolveTreeItem(item: TreeItem, element: Node): ProviderResult<TreeItem> {
    if ('Id' in element) {
      item.tooltip = new MarkdownString().appendCodeblock(
        this.document!.getText(new Range(...element.Range)),
        'powershell',
      )
      item.tooltip
        .appendMarkdown('---')
        .appendCodeblock(JSON.stringify(element.Meta, undefined, 2), 'json')
    } else {
      item.tooltip = element.Range.join(' ')
    }
    return item
  }
  //#endregion
  private tokenIdPrefix!: string
  private tokenId!: number
  private sender: AstNodeGrabber
  private document?: TextDocument
  private tree?: AstTree
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
          const editor = window.activeTextEditor!
          const range = new Range(...selection[0].Range)
          editor.revealRange(range)
          editor.setDecorations(this.treeViewDT, [{ range }])
        }
      }),
      this.view.onDidExpandElement(({ element }) => {
        if (
          'Id' in element &&
          !element.tokens &&
          this.view.selection.includes(element)
        ) {
          element.tokens = this.getTokens(element)
          // next calls getChildren, then getTreeItem
          this.tokenIdPrefix = element.Id + '-'
          this.tokenId = 0
          this._onDidChangeTreeData.fire([element])
        }
      }),
    )
  }
  private getNodeAtRange(range: Range) {
    const rv = rangeValues(range)
    const dfs = (root: Ast): Ast | undefined => {
      if (!rangeContains(root.Range, rv)) {
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
    await window
      .withProgress({ location: { viewId: 'mvext.pwshAstTreeView' } }, () =>
        this.sender.send(document.getText()).then((text) => {
          this.document = document
          this.tree = JSON.parse(text)
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
