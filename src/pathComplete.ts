import { homedir } from 'os'
import { isAbsolute, join as pathJoin } from 'path'
import { setTimeout } from 'timers/promises'
import {
  CompletionItemKind,
  CompletionTriggerKind,
  FileType,
  Uri,
  languages,
  workspace,
  type CancellationToken,
  type CompletionContext,
  type CompletionItemProvider,
  type Disposable,
  type Position,
  type TextDocument,
} from 'vscode'
import { getExtConfig } from './config'
import { isWin32, noop } from './util'

export class PathCompleteProvider
  implements CompletionItemProvider, Disposable
{
  // reference to the Vim editor's 'isfname'
  static readonly reFilePath = isWin32
    ? /(?:[-\w\\/.+,#$%{}[\]@!~=:]|[^\x00-\xff])*$/
    : /(?:[-\w/.+,#$%~=:]|[^\x00-\xff])*$/
  // resolve bash like env var
  static readonly reEnvVar = /\$\{(\w+)\}|\$(\w+)/g
  static readonly triggerCharacters = isWin32 ? ['\\', '/'] : ['/']
  static readonly kindMap = {
    [FileType.Directory]: CompletionItemKind.Folder,
    [FileType.SymbolicLink]: CompletionItemKind.Reference,
    [FileType.File]: CompletionItemKind.File,
    [FileType.Unknown]: CompletionItemKind.Value,
  }

  static expandPrefixPath(
    prefix: string,
    path: string,
    document: TextDocument,
  ) {
    const prefixMap = getExtConfig('pathComplete.prefixMap', document)
    for (const [lhs, rhs] of Object.entries(prefixMap)) {
      if (path.startsWith(lhs)) {
        path = rhs + path.slice(lhs.length)
        break
      }
      if (prefix.endsWith(lhs)) {
        path = rhs + path
        break
      }
    }
    if (path.startsWith('${workspaceFolder}')) {
      path = pathJoin(
        workspace.getWorkspaceFolder(document.uri)?.uri.fsPath ?? homedir(),
        path.slice(19),
      )
    }
    path = path.replace(
      this.reEnvVar,
      (keep, name1 = '', name2 = '') => process.env[name1 + name2] ?? keep,
    )
    for (const sep of this.triggerCharacters) {
      path = path.replace('~' + sep, homedir() + sep)
    }
    if (!isAbsolute(path)) {
      path = pathJoin(document.fileName, '..', path)
    }
    return path
  }

  private _disposables: Disposable[] = [
    languages.registerCompletionItemProvider(
      { pattern: '**' },
      this,
      ...PathCompleteProvider.triggerCharacters,
    ),
  ]

  dispose() {
    for (const d of this._disposables) {
      d.dispose()
    }
  }

  async provideCompletionItems(
    document: TextDocument,
    position: Position,
    token: CancellationToken,
    context: CompletionContext,
  ) {
    if (context.triggerKind !== CompletionTriggerKind.TriggerCharacter) {
      return
    }
    // half always endswith `triggerCharacters`
    const half = document
      .lineAt(position.line)
      .text.slice(0, position.character)
    let path = half.match(PathCompleteProvider.reFilePath)![0]
    if (path.startsWith('file://')) {
      path = path.slice(7)
    }
    if (path.split('/', 1)[0].includes(':')) {
      // invalid scheme
      return
    }
    const baseDir = PathCompleteProvider.expandPrefixPath(
      half.slice(0, -path.length),
      path,
      document,
    )
    return workspace.fs.readDirectory(Uri.file(baseDir)).then((x) => {
      const commitCharacters = [context.triggerCharacter!]
      const items = x.map(([name, type]) => ({
        label: name,
        kind: PathCompleteProvider.kindMap[type],
        detail: baseDir + name,
        commitCharacters,
      }))
      return setTimeout(
        getExtConfig('pathComplete.debounceTimeMs', document),
        items,
      )
    }, noop)
  }
}
