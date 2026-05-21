import type { ShOptions } from 'sh-syntax'
import { workspace, type ConfigurationScope } from 'vscode'
import type { TerminalRunLanguageIds } from './util/terminalRunCode'

export type MvextConfig = {
  'clock.enabled': boolean
  'evalSelection.languageMap': Record<string, string>
  'pathComplete.debounceTimeMs': number
  'pathComplete.prefixMap': Record<string, string>
  'pwsh.astTreeView.enabled': boolean
  'pwsh.astTreeView.noProcessSize': number
  'shfmt.enabled': boolean
  'shfmt.extraArgs': string[]
  'shfmt.optionsOnWeb': ShOptions
  'stylua.enabled': boolean
  'stylua.extraArgs': string[]
  'terminalLaunch.languageMap': Record<string, string>
  'terminalRunCode.defaultLanguageId': TerminalRunLanguageIds
  'treeSitter.extraParserMap': Record<string, string>
  'treeSitter.syncedLanguages': string[]
  'treeSitter.treeView.enabled': boolean
}

type ScopedConfigKey = 'pathComplete.prefixMap'

export function getExtConfig<const T extends ScopedConfigKey>(
  key: T,
  scope: ConfigurationScope,
): MvextConfig[typeof key]

export function getExtConfig<
  const T extends Exclude<keyof MvextConfig, ScopedConfigKey>,
>(key: T): MvextConfig[typeof key]

export function getExtConfig<const T extends keyof MvextConfig>(
  key: T,
  scope?: ConfigurationScope,
) {
  return workspace.getConfiguration('mvext', scope).get<MvextConfig[T]>(key)!
}
