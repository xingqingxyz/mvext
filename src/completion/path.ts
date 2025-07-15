import { homedir } from 'os'
import path from 'path'
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
  type ExtensionContext,
  type Position,
  type TextDocument,
} from 'vscode'
import { getExtConfig } from '../config'
import { isWin32 } from '../util'

export class PathCompleteProvider implements CompletionItemProvider {
  // reference to the Vim editor's 'isfname'
  static readonly reFilePath = isWin32
    ? /(?:[-\w\\/.+,#$%{}[\]@!~=:]|[^\x00-\xff])*$/
    : /(?:[-\w/.+,#$%~=:]|[^\x00-\xff])*$/
  // resolve bash like env var
  static readonly reEnvVar = /(?=\$\{)\w+(?<=\})|(?=\$)\w+/g
  static readonly triggerCharacters = isWin32 ? '\\/' : '/'
  static readonly kindMap = Object.freeze({
    [FileType.Directory]: CompletionItemKind.Folder,
    [FileType.SymbolicLink]: CompletionItemKind.Reference,
    [FileType.File]: CompletionItemKind.File,
    [FileType.Unknown]: CompletionItemKind.Value,
  })

  static expandPrefixPath(prefix: string, suffix: string, baseUri: Uri) {
    const prefixMap = getExtConfig('pathComplete.prefixMap', baseUri)
    for (const [lhs, rhs] of Object.entries(prefixMap)) {
      if (suffix.startsWith(lhs)) {
        suffix = rhs + suffix.slice(lhs.length)
        break
      }
      if (prefix.endsWith(lhs)) {
        suffix = rhs + suffix
        break
      }
    }
    if (suffix.startsWith('${workspaceFolder}')) {
      suffix = path.join(
        workspace.getWorkspaceFolder(baseUri)?.uri.fsPath ?? homedir(),
        suffix.slice(19),
      )
    }
    suffix = suffix.replace(this.reEnvVar, (name) => process.env[name] ?? '')
    if (suffix[0] === '~' && this.triggerCharacters.includes(suffix[1])) {
      suffix = homedir() + suffix.slice(1)
    }
    if (!path.isAbsolute(suffix)) {
      return path.join(baseUri.fsPath, '..', suffix)
    }
    return path.normalize(suffix)
  }
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerCompletionItemProvider(
        { scheme: 'file', pattern: '**' },
        this,
        ...PathCompleteProvider.triggerCharacters.split(''),
      ),
    )
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
    let suffix = half.match(PathCompleteProvider.reFilePath)![0]
    if (suffix.startsWith('file://')) {
      suffix = suffix.slice(7)
    } else if (suffix.split('/', 1)[0].includes(':')) {
      // invalid scheme
      return
    }
    const baseDir = PathCompleteProvider.expandPrefixPath(
      half.slice(0, -suffix.length),
      suffix,
      document.uri,
    )
    await setTimeout(getExtConfig('pathComplete.debounceTimeMs', document))
    if (token.isCancellationRequested) {
      return
    }
    const commitCharacters = [context.triggerCharacter!]
    return (await workspace.fs.readDirectory(Uri.file(baseDir))).map(
      ([name, type]) => ({
        label: name,
        kind: PathCompleteProvider.kindMap[type],
        detail: baseDir + name,
        commitCharacters,
      }),
    )
  }
}
