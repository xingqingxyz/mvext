import { homedir } from 'os'
import { join as pathJoin } from 'path'
import { setTimeout as setTimeoutPromise } from 'timers/promises'
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
import { isWin32 } from './util'

export class PathCompleteProvider
  implements CompletionItemProvider, Disposable
{
  // reference to the Vim editor's 'isfname'
  static readonly reFilePath = isWin32
    ? /(?:[-\w\\/.+,#$%{}[\]@!~=:]|[^\x30-\x39])*$/
    : /(?:[-\w/.+,#$%~=:]|[^\x30-\x39])*$/
  // resolve powershell env var and bash like env var
  static readonly reEnvVar = isWin32 ? /\${Env:(\w+)}/gi : /\$(\w+)/g
  static readonly triggerCharacters = isWin32 ? ['\\', '/'] : ['/']
  static readonly kindMap = {
    [FileType.Directory]: CompletionItemKind.Folder,
    [FileType.SymbolicLink]: CompletionItemKind.Reference,
    [FileType.File]: CompletionItemKind.File,
    [FileType.Unknown]: CompletionItemKind.Value,
  }
  private _disposables: Disposable[]

  constructor() {
    this._disposables = [
      languages.registerCompletionItemProvider(
        { pattern: '**' },
        this,
        ...PathCompleteProvider.triggerCharacters,
      ),
    ]
  }

  dispose() {
    for (const d of this._disposables) {
      d.dispose()
    }
  }

  private _expandPrefixPath(
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
      PathCompleteProvider.reEnvVar,
      (keep, name) => process.env[name] ?? keep,
    )
    for (const sep of PathCompleteProvider.triggerCharacters) {
      path = path.replace('~' + sep, homedir() + sep)
    }
    if (!PathCompleteProvider.triggerCharacters.includes(path[0])) {
      path = pathJoin(document.fileName, '..', path)
    }
    return path
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
    const uri = Uri.parse(
      half.match(PathCompleteProvider.reFilePath)![0],
      false,
    )
    if (uri.scheme !== 'file') {
      return
    }
    const path = uri.fsPath
    const baseDir = this._expandPrefixPath(
      half.slice(0, -path.length),
      path,
      document,
    )
    return workspace.fs.readDirectory(Uri.file(baseDir)).then((x) => {
      if (token.isCancellationRequested) {
        return
      }
      const commitCharacters = [context.triggerCharacter!]
      const items = x.map(([name, type]) => ({
        label: name,
        kind: PathCompleteProvider.kindMap[type],
        detail: baseDir + name,
        commitCharacters,
      }))
      return setTimeoutPromise(
        getExtConfig('pathComplete.debounceTimeMs', document),
        items,
      )
    })
  }
}
