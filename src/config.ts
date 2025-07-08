import { workspace, type ConfigurationScope } from 'vscode'

type Config = {
  'lineComplete.enabled': boolean
}

export function getExtConfig<T extends keyof Config>(
  key: T,
  scope?: ConfigurationScope,
): Config[T] {
  return workspace.getConfiguration('vincode', scope).get<Config[T]>(key)!
}
