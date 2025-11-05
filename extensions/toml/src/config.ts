import { workspace, type ConfigurationScope } from 'vscode'

export type ExtConfig = {
  _: boolean
  'taplo.path': string
  'taplo.extraArgs': string[]
}

type ScopedConfigKey = '_'

export function getExtConfig<const T extends ScopedConfigKey>(
  key: T,
  scope: ConfigurationScope
): ExtConfig[typeof key]

export function getExtConfig<
  const T extends Exclude<keyof ExtConfig, ScopedConfigKey>
>(key: T): ExtConfig[typeof key]

export function getExtConfig<const T extends keyof ExtConfig>(
  key: T,
  scope?: ConfigurationScope
) {
  return workspace.getConfiguration('toml', scope).get<ExtConfig[T]>(key)!
}
