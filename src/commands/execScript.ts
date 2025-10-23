import { logger } from '@/util/logger'
import { constants, runInNewContext } from 'vm'
import * as vscode from 'vscode'
import { window } from 'vscode'

export async function execScript() {
  try {
    const result = await runInNewContext(
      window.activeTextEditor!.document.getText(),
      { vscode },
      {
        importModuleDynamically: constants.USE_MAIN_CONTEXT_DEFAULT_LOADER,
      },
    )
    logger.info('exec script result:', result)
  } catch (e) {
    logger.error('exec script with vscode api failed:', e)
  }
}
