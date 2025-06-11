import type { ExtensionContext } from 'vscode'

/**
 * Workspace state Memento keys
 */
export enum WStateKey {
  hexColorEnabledLanguages = 'hexColorEnabledLanguages',
}

let context: ExtensionContext

export function getExtContext(): ExtensionContext {
  return context
}

export function setExtContext(ctx: ExtensionContext) {
  context = ctx
}
