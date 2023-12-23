import { ConfigurationScope, workspace } from 'vscode'

interface PathCompleteConfig {
  trimRelativePrefix: boolean
  prefixMap: Record<string, string>
}

type ShellEditConfig = Record<
  `${'node' | 'python' | 'shellscript' | 'powershell'}CommandLine`,
  string[]
>

export interface MvextConfig {
  pathComplete: PathCompleteConfig
  shellEdit: ShellEditConfig
}

export function getConfig<const T extends keyof MvextConfig>(
  scope: ConfigurationScope | null | undefined,
  submodule: T,
) {
  const config = workspace.getConfiguration('mvext.' + submodule, scope)
  return config as unknown as MvextConfig[typeof submodule]
}
