import { logger } from '@/util/logger'
import { constants, runInNewContext } from 'vm'
import * as vscode from 'vscode'
import { Position, window } from 'vscode'

export async function execScript() {
  const editor = window.activeTextEditor
  if (!editor) {
    return
  }
  const text = editor.document.getText()
  if (!text.startsWith('/// <reference path="')) {
    await editor.edit((edit) =>
      edit.insert(
        new Position(0, 0),
        `/// <reference path="${execScript.dtsPath}" />\n`,
      ),
    )
    logger.info('exec script no reference types, inserted, canceled')
    return
  }
  try {
    const result = await runInNewContext(
      text,
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

export namespace execScript {
  export let dtsPath: string
}
