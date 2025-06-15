import { workspace, type ConfigurationScope } from 'vscode'
import type { WordCase } from './util/transformCaseHelper'

export type MvextConfig = {
  'terminalLaunch.languages': Record<string, string>
  'pathComplete.prefixMap': Record<string, string>
  'pathComplete.debounceTimeMs': number
  'runCodeBlock.timeoutMs': number
  'transformCase.defaultCase': WordCase
  'shfmt.extraArgs': string[]
  'stylua.extraArgs': string[]
  'dictionaryComplete.enabled': boolean
} & Record<
  `evalSelection.${'node' | 'python' | 'shellscript' | 'powershell'}.cmd`,
  string[]
>

export function getExtConfig<const T extends keyof MvextConfig>(
  key: T,
  scope?: ConfigurationScope | null,
) {
  return workspace
    .getConfiguration('mvext', scope)
    .get<MvextConfig[typeof key]>(key)!
}
