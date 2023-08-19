import vscode from 'vscode'
import { internalCmd } from '../constants'

const { executeCommand } = vscode.commands

export async function execPrepareRename(
  fileUri: vscode.Uri,
  position: vscode.Position,
) {
  return await executeCommand<{ placeholder: string }>(
    internalCmd.prepareRename,
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
    internalCmd.renameProvider,
    fileUri,
    position,
    renameTo,
  )
}

export async function execOpen(uri: vscode.Uri) {
  return await executeCommand(internalCmd.open, uri)
}
