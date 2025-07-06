import { commands } from 'vscode'

/**
 * editor.actions.findWithArgs - Open a new In-Editor Find Widget with specific options.
 * @param searchString - String to prefill the find input
 * @param replaceString - String to prefill the replace input
 * @param isRegex - enable regex
 * @param preserveCase - try to keep the same case when replacing
 * @param findInSelection - restrict the find location to the current selection
 * @param matchWholeWord
 * @param isCaseSensitive
 */
export function execFindWithArgs(options: {
  searchString: string
  replaceString?: string
  isRegex?: boolean
  preserveCase?: boolean
  findInSelection?: boolean
  matchWholeWord?: boolean
  isCaseSensitive?: boolean
  findInAllFiles?: boolean
}) {
  return commands.executeCommand<void>(
    options.findInAllFiles
      ? 'workbench.action.findInFiles'
      : 'editor.actions.findWithArgs',
    options.searchString,
    options.replaceString,
    options.isRegex,
    options.preserveCase,
    options.findInSelection,
    options.matchWholeWord,
    options.isCaseSensitive,
  )
}

export function search() {}
