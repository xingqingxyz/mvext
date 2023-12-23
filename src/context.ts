import { ExtensionContext } from 'vscode'

export let extContext: ExtensionContext

export function setExtContext(context: ExtensionContext) {
  extContext = context
}
