import vscode from 'vscode'

const { executeCommand } = vscode.commands

export const enum vscodeCmd {
  open = 'vscode.open',
  prepareRename = 'vscode.prepareRename',
  renameProvider = 'vscode.executeDocumentRenameProvider',
}

//#region vscode
export async function execPrepareRename(
  fileUri: vscode.Uri,
  position: vscode.Position,
) {
  return await executeCommand<{ placeholder: string }>(
    vscodeCmd.prepareRename,
    fileUri,
    position,
  )
}

export async function execRename(
  fileUri: vscode.Uri,
  position: vscode.Position,
  renameTo: string,
) {
  return await executeCommand<vscode.WorkspaceEdit>(
    vscodeCmd.renameProvider,
    fileUri,
    position,
    renameTo,
  )
}

export async function execOpen(uri: vscode.Uri): Promise<void> {
  return await executeCommand(vscodeCmd.open, uri)
}
//#endregion
