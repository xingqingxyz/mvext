import { workspace, type ConfigurationScope } from 'vscode'

export type NameCase =
  | 'preferKebabCase'
  | 'preferCamelCase'
  | 'alwaysKebabCase'
  | 'alwaysCamelCase'

export type ExtConfig = {
  _: boolean
  'autoInsert.bracketSpacing': boolean
  'autoInsert.dotValue': boolean
  'format.script.initialIndent': boolean
  'format.style.initialIndent': boolean
  'format.template.initialIndent': boolean
  'format.wrapAttributes':
    | 'auto'
    | 'force'
    | 'force-aligned'
    | 'force-expand-multiline'
    | 'aligned-multiple'
    | 'preserve'
    | 'preserve-aligned'
  'inlayHints.destructuredProps': boolean
  'inlayHints.inlineHandlerLeading': boolean
  'inlayHints.missingProps': boolean
  'inlayHints.optionsWrapper': boolean
  'inlayHints.vBindShorthand': boolean
  'server.path'?: string
  'server.trace': 'off' | 'messages' | 'verbose'
  'suggest.componentNameCasing': NameCase
  'suggest.defineAssignment': boolean
  'suggest.propNameCasing': NameCase
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
  return workspace.getConfiguration('vue', scope).get<ExtConfig[T]>(key)!
}
