import type { ExtensionContext } from 'vscode'

/**
 * Workspace state Memento keys
 */
export enum WStateKey {
  hexColorLanguages = 'hexColor.languages',
  terminalLaunchLastArgs = 'terminalLaunch.lastArgs',
}

/**
 * All extension setContext call keys
 */
export enum ContextKey {
  terminalLaunchLanguages = 'mvext.terminalLaunch.languages',
}

export let extContext: ExtensionContext
export function setExtContext(context: ExtensionContext) {
  extContext = context
}
