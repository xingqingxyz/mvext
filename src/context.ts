import { ExtensionContext } from 'vscode'

let context: ExtensionContext

export function getExtContext(): ExtensionContext {
  return context
}

export function setExtContext(ctx: ExtensionContext) {
  context = ctx
}
