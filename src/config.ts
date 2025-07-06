import {
  workspace,
  type ConfigurationScope,
  type ExtensionContext,
} from 'vscode'

type Config = {
  'lineComplete.enabled': boolean
}

export function getExtConfig<T extends keyof Config>(
  key: T,
  scope?: ConfigurationScope,
): Config[T] {
  return workspace.getConfiguration('vincode', scope).get<Config[T]>(key)!
}

export let extContext: ExtensionContext
export function setExtContext(context: ExtensionContext) {
  extContext = context
}
