// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import * as vscode from 'vscode'

export interface IExternalPowerShellDetails {
  exePath: string
  version: string
  displayName: string
  architecture: string
}

export interface IPowerShellExtensionClient {
  registerExternalExtension(id: string, apiVersion?: string): string
  unregisterExternalExtension(uuid: string): boolean
  getPowerShellVersionDetails(uuid: string): Promise<IExternalPowerShellDetails>
  waitUntilStarted(uuid: string): Promise<void>
  getStorageUri(): vscode.Uri
  getLogUri(): vscode.Uri
}
