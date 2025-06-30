import { workspace, type ConfigurationScope } from 'vscode'
import type { TerminalRunLanguageIds } from './util/terminalRunCode'
import type { WordCase } from './util/transformCaseHelper'

export type MvextConfig = {
  'evalSelection.languages': Record<string, string>
  'terminalLaunch.languages': Record<string, string>
  'pathComplete.prefixMap': Record<string, string>
  'pathComplete.debounceTimeMs': number
  'terminalRunCode.defaultLanguageId': TerminalRunLanguageIds
  'transformCase.defaultCase': WordCase
  'shfmt.extraArgs': string[]
  'stylua.extraArgs': string[]
  'dictionaryComplete.enabled': boolean
}

export function getExtConfig<const T extends keyof MvextConfig>(
  key: T,
  scope?: ConfigurationScope | null,
) {
  return workspace
    .getConfiguration('mvext', scope)
    .get<MvextConfig[typeof key]>(key)!
}
