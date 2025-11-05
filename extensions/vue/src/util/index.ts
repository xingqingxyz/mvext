import path from 'path'
import { workspace } from 'vscode'

export function resolveConfigPath(cfgPath: string | undefined) {
  if (!cfgPath?.length) {
    return
  }
  if (path.isAbsolute(cfgPath)) {
    return cfgPath
  }
  if (workspace.workspaceFolders) {
    return path.join(workspace.workspaceFolders[0].uri.fsPath, cfgPath)
  }
}
