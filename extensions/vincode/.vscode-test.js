import { defineConfig } from '@vscode/test-cli'
import which from 'which'

export default defineConfig({
  files: 'out/test/**/*.test.js',
  workspaceFolder: 'fixtures',
  useInstallation: { fromPath: await which('code') },
})
