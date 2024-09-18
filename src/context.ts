import type { ExtensionContext } from 'vscode'

export enum WspStatKey {
  hexColorEnabled,
}

let context: ExtensionContext

export function getExtContext(): ExtensionContext {
  return context
}

export function setExtContext(ctx: ExtensionContext) {
  context = ctx
}
