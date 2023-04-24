'use strict'
import changeCase from 'change-case'
import os from 'os'
import vscode from 'vscode'

interface Action {
  label: string
  description: string
  dispatch: (s: string, ...args: any[]) => string
}
const initialCommands: Action[] = [
  {
    label: 'camelCase',
    description: 'Transform to camelCase',
  },
  {
    label: 'constantCase',
    description: 'Transform to uppercase, separated with underscore',
  },
  {
    label: 'dotCase',
    description: 'Transform to lowercase, separated with dot',
  },
  {
    label: 'paramCase',
    description: 'Transform to lowercase, separated with dash',
  },
  {
    label: 'noCase',
    description: 'Transform to lowercase, separated with whitespace',
  },
  {
    label: 'pascalCase',
    description: 'Transform to PascalCase',
  },
  {
    label: 'pathCase',
    description: 'Transform to lowercase, separated with slash',
  },
  {
    label: 'sentenceCase',
    description:
      'Transform to lowercase, separated with whitespace, upper first character',
  },
  {
    label: 'headerCase',
    description:
      'Transform to lowercase, separated with whitespace, upper first character',
  },
  {
    label: 'snakeCase',
    description: 'Transform to lowercase, separated with underscore',
  },
  {
    label: 'capitalCase',
    description: 'Transform each to capital case, separated with whitespace',
  },
].map(o => ({ ...o, dispatch: changeCase[o.label as keyof typeof changeCase] }))
const extraCommands: Action[] = [
  {
    label: 'pathCaseWindows',
    description: 'Transform to lowercase, separated with backslash',
    dispatch: (s: string) => changeCase.pathCase(s, { delimiter: '\\' }),
  },
  {
    label: 'swapCase',
    description: 'Transform each character case reversed',
    dispatch: (s: string) =>
      s
        .split('')
        .map(ch =>
          ch.search(/[a-z]/) >= 0 ? ch.toUpperCase() : ch.toLowerCase()
        )
        .join(''),
  },
]
const commands = Object.assign(initialCommands, extraCommands)
function changeCaseCommands() {
  const firstSelectedText = getSelectedTextIfOnlyOneSelection()
  const opts = {
    matchOnDescription: true,
    placeHolder: 'What do you want to do to the current word / selection(s)?',
  }

  const items = commands.map(c => ({
    label: c.label,
    description: firstSelectedText
      ? `Convert to ${c.dispatch(firstSelectedText)}`
      : c.description,
  }))
  vscode.window
    .showQuickPick(items, opts)
    .then(command => command && runCommand(command.label))
}
exports.changeCaseCommands = changeCaseCommands

function runCommand(commandLabel: string) {
  const commandDefinition = commands.find(c => c.label === commandLabel)!
  const editor = vscode.window.activeTextEditor
  if (!editor) return
  const { document, selections } = editor
  let replacementActions: {
    text: string
    range: vscode.Range
    replacement: string
    offset: number
    newRange: vscode.Range
  }[] = []

  editor
    .edit(editBuilder => {
      replacementActions = selections.map(selection => {
        const { text, range } = getSelectedText(selection, document)
        if (!text || !range) throw Error('No such selection')
        let replacement
        let offset
        if (selection.isSingleLine) {
          replacement = commandDefinition.dispatch(text)
          offset = replacement.length - text.length
        } else {
          const lines = document.getText(range).split(os.EOL)
          const replacementLines = lines.map(x => commandDefinition.dispatch(x))
          replacement = replacementLines.reduce(
            (res, v) => res + os.EOL + v,
            ''
          )
          offset =
            replacementLines[replacementLines.length - 1].length -
            lines[lines.length - 1].length
        }
        return {
          text,
          range,
          replacement,
          offset,
          newRange: isRangeSimplyCursorPosition(range)
            ? range
            : new vscode.Range(
                range.start.line,
                range.start.character,
                range.end.line,
                range.end.character + offset
              ),
        }
      })
      replacementActions
        .filter(x => x.replacement !== x.text)
        .forEach(x => {
          editBuilder.replace(x.range, x.replacement)
        })
    })
    .then(() => {
      const sortedActions = replacementActions.sort((a, b) =>
        compareByEndPosition(a.newRange, b.newRange)
      )

      const lineRunningOffsets = Array.from(
        new Set(sortedActions.map(s => s.range.end.line))
      ).map(lineNumber => ({ lineNumber, runningOffset: 0 }))
      const adjustedSelectionCoordinateList = sortedActions.map(s => {
        const lineRunningOffset = lineRunningOffsets.filter(
          lro => lro.lineNumber === s.range.end.line
        )[0]
        const range = new vscode.Range(
          s.newRange.start.line,
          s.newRange.start.character + lineRunningOffset.runningOffset,
          s.newRange.end.line,
          s.newRange.end.character + lineRunningOffset.runningOffset
        )
        lineRunningOffset.runningOffset += s.offset
        return range
      })
      // now finally set the newly created selections
      editor.selections = adjustedSelectionCoordinateList.map(r =>
        toSelection(r)
      )
    })
}
exports.runCommand = runCommand
function getSelectedTextIfOnlyOneSelection() {
  const editor = vscode.window.activeTextEditor
  if (!editor) return
  const { document, selection, selections } = editor
  // check if there's only one selection or if the selection spans multiple lines
  if (selections.length > 1 || selection.start.line !== selection.end.line)
    return undefined
  return getSelectedText(selections[0], document).text
}
function getSelectedText(
  selection: vscode.Selection,
  document: vscode.TextDocument
) {
  let range
  if (isRangeSimplyCursorPosition(selection)) {
    range = getChangeCaseWordRangeAtPosition(document, selection.end)
  } else {
    range = new vscode.Range(selection.start, selection.end)
  }
  return {
    text: range ? document.getText(range) : undefined,
    range,
  }
}

function getChangeCaseWordRangeAtPosition(
  document: vscode.TextDocument,
  position: vscode.Position
) {
  const range = document.getWordRangeAtPosition(position)
  if (!range) return

  const wordSequence = /([\w$_.-/]+)/
  let startCharacterIndex = range.start.character - 1
  while (startCharacterIndex >= 0) {
    const charRange = new vscode.Range(
      range.start.line,
      startCharacterIndex,
      range.start.line,
      startCharacterIndex + 1
    )
    const character = document.getText(charRange)
    if (character.search(wordSequence) === -1) {
      break
    }
    startCharacterIndex--
  }
  const lineMaxColumn = document.lineAt(range.end.line).range.end.character
  let endCharacterIndex = range.end.character
  while (endCharacterIndex < lineMaxColumn) {
    const charRange = new vscode.Range(
      range.end.line,
      endCharacterIndex,
      range.end.line,
      endCharacterIndex + 1
    )
    const character = document.getText(charRange)
    if (character.search(wordSequence) === -1) {
      break
    }
    endCharacterIndex++
  }
  return new vscode.Range(
    range.start.line,
    startCharacterIndex + 1,
    range.end.line,
    endCharacterIndex
  )
}
function isRangeSimplyCursorPosition(range: vscode.Range) {
  return (
    range.start.line === range.end.line &&
    range.start.character === range.end.character
  )
}
function toSelection(range: vscode.Range) {
  return new vscode.Selection(
    range.start.line,
    range.start.character,
    range.end.line,
    range.end.character
  )
}
function compareByEndPosition(a: vscode.Range, b: vscode.Range) {
  return a.end.line < b.end.line
    ? -1
    : a.end.line > b.end.line
    ? 1
    : a.end.character < b.end.character
    ? -1
    : a.end.character > b.end.character
    ? 1
    : 0
}
