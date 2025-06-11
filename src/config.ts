import { workspace, type ConfigurationScope } from 'vscode'
import type { WordCase } from './util/transformCaseHelper'

export type MvextConfig = {
  // path complete
  'pathComplete.prefixMap': Record<string, string>
  // path complete debounceTimeMs
  'pathComplete.debounceTimeMs': number
  'runCodeBlock.timeoutMs': number
  // case transform
  'transformCase.defaultCase': WordCase
  'shfmt.extraArgs': string[]
  'stylua.extraArgs': string[]
  lineCompleteEnabled: boolean
  dictionaryCompleteEnabled: boolean
} & Record<
  // shell edit
  `shellEdit.${'node' | 'python' | 'shellscript' | 'powershell'}.cmd`,
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
