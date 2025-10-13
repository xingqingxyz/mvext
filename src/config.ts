import type { ShOptions } from 'sh-syntax'
import { workspace, type ConfigurationScope } from 'vscode'
import type { TSLanguageId } from './tsParser'
import type { TerminalRunLanguageIds } from './util/terminalRunCode'
import type { WordCase } from './util/transformCaseHelper'

export type MvextConfig = {
  'evalSelection.languageMap': Record<string, string>
  'terminalLaunch.languageMap': Record<string, string>
  'pathComplete.prefixMap': Record<string, string>
  'treeSitter.syncedLanguages': TSLanguageId[]
  'pathComplete.debounceTimeMs': number
  'terminalRunCode.defaultLanguageId': TerminalRunLanguageIds
  'transformCase.defaultCase': WordCase
  'pwshAstTreeView.enabled': boolean
  'pwshAstTreeView.noProcessSize': number
  'treeSitterTreeView.enabled': boolean
  'shfmt.enabled': boolean
  'stylua.enabled': boolean
  'shfmt.extraArgs': string[]
  'shfmt.optionsOnWeb': ShOptions
  'stylua.extraArgs': string[]
}

type ScopedConfigKey = 'pathComplete.prefixMap' | 'transformCase.defaultCase'

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
