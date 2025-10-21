import { homedir } from 'os'
import path from 'path'
import {
  CompletionItemKind,
  CompletionTriggerKind,
  FileType,
  Position,
  Uri,
  languages,
  workspace,
  type CancellationToken,
  type CompletionContext,
  type CompletionItem,
  type CompletionItemProvider,
  type ExtensionContext,
  type TextDocument,
} from 'vscode'
import { getExtConfig } from '../config'
import { noop, setTimeoutPm } from '../util'

export class PathCompleteProvider implements CompletionItemProvider {
  private static readonly rePath = /(?:[-\w\\/.+,#$%{}[\]@!~=:]|[^\x00-\xff])+/
  private static readonly kindMap = /* @__PURE__ */ Object.freeze({
    [FileType.Directory]: CompletionItemKind.Folder,
    [FileType.File]: CompletionItemKind.File,
    [FileType.SymbolicLink]: CompletionItemKind.Reference,
    [FileType.Unknown]: CompletionItemKind.Text,
  })
  private static expandPath(text: string, document: TextDocument) {
    const prefixMap = getExtConfig('pathComplete.prefixMap', document)
    for (const [lhs, rhs] of Object.entries(prefixMap)) {
      if (text.startsWith(lhs)) {
        text = rhs + text.slice(lhs.length)
        break
      }
    }
    if (text.startsWith('/') && document.languageId.endsWith('ignore')) {
      return Uri.joinPath(document.uri, '..' + text)
    }
    if (path.isAbsolute(text)) {
      return Uri.file(text)
    }
    if (text.startsWith('file://')) {
      return Uri.parse(text, true)
    }
    const [first, rest] = text.split(/[\\/]+/, 1)
    let uri
    if (first === '~') {
      uri = __WEB__
        ? (workspace.getWorkspaceFolder(document.uri)?.uri ??
          document.uri.with({ path: '/' }))
        : Uri.file(homedir())
    } else if (first.startsWith('$')) {
      const reEnvVar =
        document.languageId === 'powershell'
          ? /^\$\{?env:(\w+)\}?$/i
          : /^\$\{?(\w+)\}?$/
      const envVarName = first.match(reEnvVar)?.[1]
      if (envVarName === 'workspaceFolder') {
        uri =
          workspace.getWorkspaceFolder(document.uri)?.uri ??
          document.uri.with({ path: '/' })
      } else if (!__WEB__ && envVarName) {
        const envVarValue = process.env[envVarName]
        if (envVarValue && path.isAbsolute(envVarValue)) {
          uri = Uri.file(envVarValue)
        }
      }
    }
    if (uri) {
      return Uri.joinPath(uri, rest)
    }
    // relative
    uri = document.uri
    let scheme
    switch (uri.scheme) {
      case 'untitled':
      case 'vscode-notebook-cell':
        scheme = workspace.getWorkspaceFolder(uri)?.uri.scheme
        break
    }
    return Uri.joinPath(uri.with({ scheme }), '..', text)
  }
  constructor(context: ExtensionContext) {
    context.subscriptions.push(
      languages.registerCompletionItemProvider(
        [
          { scheme: 'file' },
          { scheme: 'untitled' },
          { scheme: 'vscode-vfs' },
          { scheme: 'vscode-remote' },
          { scheme: 'vscode-userdata' },
          { scheme: 'vscode-notebook-cell' },
        ],
        this,
        '\\',
        '/',
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
    await setTimeoutPm(getExtConfig('pathComplete.debounceTimeMs'))
    if (token.isCancellationRequested) {
      return
    }
    const text = document.getText(
      document.getWordRangeAtPosition(position, PathCompleteProvider.rePath),
    )
    const uri = PathCompleteProvider.expandPath(text, document)
    const commitCharacters = [context.triggerCharacter!]
    return await workspace.fs.readDirectory(uri).then(
      (dirent) =>
        dirent.map(
          ([name, type]) =>
            ({
              label: name,
              kind: PathCompleteProvider.kindMap[type],
              detail: Uri.joinPath(uri, name) + '',
              commitCharacters,
            }) as CompletionItem,
        ),
      noop,
    )
  }
}
