import type {
	Disposable,
	ExtensionContext,
	QuickPickItem,
	Range,
	Selection,
	WorkspaceEdit,
	Position,
} from 'vscode'
import vscode = require('vscode')
import transform = require('./utils/caseTransform')
import type { WordCase } from './utils/caseTransform'
const { joinCaseActions, caseTransform } = transform
const { registerTextEditorCommand, executeCommand } = vscode.commands

let subscriptions: Disposable[] = []

function register(ctx: ExtensionContext) {
	subscriptions = ctx.subscriptions
	for (const wc in joinCaseActions) {
		subscriptions.push(
			registerTextEditorCommand(
				`mvext.transformTo${wc[0].toUpperCase() + wc.substring(1)}`,
				(editor, edit) => dispatch(editor, edit, wc as WordCase)
			)
		)
	}
	subscriptions.push(
		registerTextEditorCommand('mvext.detectTransformCase', dispatchDetect)
	)
}

const reSequence = /[a-zA-Z_\-$][\w_\-$]*/

async function dispatch(
	editor: vscode.TextEditor,
	edit: vscode.TextEditorEdit,
	wc: WordCase
) {
	const { document, selection, selections } = editor
	if (selections.length < 2 && selection.isEmpty) {
		let transformFn: Parameters<typeof renameWord>[3]
		switch (wc) {
			case 'lowerCase':
				transformFn = (s) => s.toLowerCase()
				break
			case 'upperCase':
				transformFn = (s) => s.toUpperCase()
				break
			default:
				transformFn = caseTransform
				break
		}
		await renameWord(document, selection.start, editor, transformFn, wc)
	} else {
		const rest: Selection[] = []
		editor.edit(
			(b) => {
				for (const selectionIt of selections) {
					if (selectionIt.isEmpty) {
						const range = document.getWordRangeAtPosition(
							selectionIt.start,
							reSequence
						)
						if (range) {
							const text = document.getText(range)
							b.replace(range, caseTransform(text, wc))
						}
					} else {
						rest.push(selectionIt)
					}
				}
			},
			{ undoStopBefore: true, undoStopAfter: false }
		)
		if (rest.length) {
			editor.edit(
				(b) => {
					for (const selectionIt of selections) {
						const text = editor.document.getText(selectionIt)
						b.replace(selectionIt, caseTransform(text, wc))
					}
				},
				{
					undoStopBefore: false,
					undoStopAfter: true,
				}
			)
		}
	}
}

async function renameWord(
	document: vscode.TextDocument,
	position: Position,
	editor: vscode.TextEditor,
	transformFn: (word: string, ...args: any[]) => string,
	...args: any[]
) {
	const cmdPrepareRename = 'vscode.prepareRename'
	const cmdRenameProvider = 'vscode.executeDocumentRenameProvider'

	try {
		const fileUri = document.uri
		const { placeholder } = (await executeCommand(
			cmdPrepareRename,
			fileUri,
			position
		)) as { range: Range; placeholder: string }
		const wspEdit: WorkspaceEdit = await executeCommand(
			cmdRenameProvider,
			fileUri,
			position,
			transformFn(placeholder, ...args)
		)
		await vscode.workspace.applyEdit(wspEdit)
	} catch {
		const range = document.getWordRangeAtPosition(position, reSequence)
		if (range) {
			const text = document.getText(range)
			editor.edit((b) => b.replace(range, transformFn(text, ...args)))
		}
	}
}

const caseDetectPickItems: (QuickPickItem & { label: WordCase })[] = [
	{
		label: 'camelCase',
		description: 'loveWorld',
	},
	{
		label: 'capitalCase',
		description: 'Love World',
	},
	{
		label: 'constantCase',
		description: 'LOVE_WORLD',
	},
	{
		label: 'dotCase',
		description: 'love.world',
	},
	{
		label: 'headerCase',
		description: 'Love-World',
	},
	{
		label: 'noCase',
		description: 'love world',
	},
	{
		label: 'paramCase',
		description: 'love-world',
	},
	{
		label: 'pascalCase',
		description: 'LoveWorld',
	},
	{
		label: 'pathCase',
		description: 'love/world',
	},
	{
		label: 'sentenceCase',
		description: 'Love world',
	},
	{
		label: 'snakeCase',
		description: 'love_world',
	},
	{
		label: 'lowerCase',
		description: 'loveworld',
	},
	{
		label: 'upperCase',
		description: 'LOVEWORLD',
	},
]

function showDetectPicks(wc: WordCase) {
	const picks = vscode.window.createQuickPick()
	picks.items = caseDetectPickItems
	picks.placeholder = "Please tell me which case of word you'd like to:"
	picks.title = 'Select Word Case'
	picks.activeItems = [
		picks.items.find((v) => v.label === wc) as QuickPickItem,
	]
	picks.show()

	return new Promise<WordCase>((resolve) =>
		picks.onDidAccept(
			() => {
				resolve(picks.selectedItems[0].label as WordCase)
				picks.dispose()
			},
			undefined,
			subscriptions
		)
	)
}

async function dispatchDetect(
	{ selections, document }: vscode.TextEditor,
	edit: vscode.TextEditorEdit
) {
	if (selections[0].isEmpty) {
		return
	}
	const text = document.getText(selections[0])
	const reCaseSplitter = /(\/)|(\.)|(-)|(_)|( )/
	const matches = text.match(reCaseSplitter)

	let wordCase: WordCase
	if (matches) {
		const idx = matches.findIndex((v, i) => v && i)
		switch (idx) {
			case 1:
				wordCase = 'pathCase'
				break
			case 2:
				wordCase = 'dotCase'
				break
			case 3:
				wordCase = 'paramCase'
				break
			case 4:
				wordCase = 'snakeCase'
				break
			case 5:
				wordCase = 'sentenceCase'
				break
			default:
				wordCase = 'camelCase'
				break
		}
		try {
			const picked = await showDetectPicks(wordCase)
			for (const selectionIt of selections) {
				const text = document.getText(selectionIt)
				edit.replace(selectionIt, caseTransform(text, picked))
			}
		} catch {}
	}
}

export = {
	register,
}
