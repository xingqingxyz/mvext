import { ConfigurationScope, workspace } from 'vscode'
import type { WordCase } from './util/transformCaseHelper'

export type MvextConfig = {
  // path complete
  'pathComplete.prefixMap': Record<string, string>
  // case transform
  'transformCase.targetCase': WordCase
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
