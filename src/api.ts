import type {
	Disposable,
	ExtensionContext,
	QuickPickItem,
	Range,
	Selection,
	TextEditor,
	TextEditorEdit,
	WorkspaceEdit,
} from 'vscode';
import type { WordCase } from './caseTransform';

import vscode = require('vscode');
const { registerCommand, executeCommand } = vscode.commands;
const { dispatchNorm, dispatchWord } = require('./cases');

const extraCase = ['lowerCase', 'upperCase'] as const;
type ExtraCase = (typeof extraCase)[number];
const cmdPrepareRename = 'vscode.prepareRename';
const cmdRenameProvider = 'vscode.executeDocumentRenameProvider';
const disposables: Disposable[] = [];

function register(ctx: ExtensionContext) {
	for (const wc of [...Object.keys(dispatchNorm), ...extraCase]) {
		disposables.push(
			registerCommand(
				`my-extension.transformTo${wc[0].toUpperCase() + wc.substring(1)}`,
				() => dispatch(wc as WordCase)
			)
		);
	}
	disposables.push(registerCommand('my-extension.detectTransformCase', dispatchDetect));
	ctx.subscriptions.push(...disposables);
}

async function dispatch(wordCase: WordCase | ExtraCase) {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	const { document, selection, selections } = editor;
	if (selections.length < 2 && selection.isEmpty) {
		if (extraCase.includes(wordCase as ExtraCase)) {
			await renameWord(document, selection, editor, word =>
				wordCase === 'lowerCase' ? word.toLowerCase() : word.toUpperCase()
			);
		} else {
			await renameWord(document, selection, editor, dispatchWord, wordCase);
		}
	} else {
		if (extraCase.includes(wordCase as ExtraCase)) {
			await executeCommand(
				wordCase === 'lowerCase'
					? 'editor.action.transformToLowercase'
					: 'editor.action.transformToUppercase'
			);
		} else {
			const rest: Selection[] = [];
			editor.edit(
				b => {
					for (const selectionIt of selections) {
						if (selectionIt.isEmpty) {
							const range = document.getWordRangeAtPosition(
								selectionIt.start
							);
							if (range) {
								const text = document.getText(range);
								b.replace(
									range,
									dispatchWord(text, wordCase as WordCase)
								);
							}
						} else {
							rest.push(selectionIt);
						}
					}
				},
				{ undoStopBefore: true, undoStopAfter: false }
			);
			if (rest.length) {
				editor.edit(editSelections(editor, rest, wordCase as WordCase), {
					undoStopBefore: false,
					undoStopAfter: true,
				});
			}
		}
	}
}

const pickItems: (QuickPickItem & { label: WordCase })[] = [
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
];

async function renameWord(
	document: vscode.TextDocument,
	selection: Selection,
	editor: TextEditor,
	dispatchWord: (word: string, ...args: any[]) => string,
	...args: any[]
) {
	try {
		const fileUri = document.uri;
		const { placeholder } = (await executeCommand(
			cmdPrepareRename,
			fileUri,
			selection.start
		)) as { range: Range; placeholder: string };
		const wspEdit: WorkspaceEdit = await executeCommand(
			cmdRenameProvider,
			fileUri,
			selection.start,
			dispatchWord(placeholder, ...args)
		);
		await vscode.workspace.applyEdit(wspEdit);
	} catch {
		const range = document.getWordRangeAtPosition(selection.start);
		if (range) {
			const text = document.getText(range);
			editor.edit(b => b.replace(range, dispatchWord(text, ...args)));
		}
	}
}

function showPickCase(wc: WordCase) {
	const picks = vscode.window.createQuickPick();
	picks.items = pickItems;
	picks.placeholder = "Please tell me which case of word you'd like to:";
	picks.title = 'Select Word Case';
	picks.activeItems = [picks.items.find(v => v.label === wc) as QuickPickItem];
	picks.show();

	return new Promise<WordCase>(resolve =>
		picks.onDidAccept(
			() => {
				resolve(picks.selectedItems[0].label as WordCase);
				picks.dispose();
			},
			undefined,
			disposables
		)
	);
}

function editSelections(
	editor: TextEditor,
	selections: readonly Selection[],
	wc: WordCase
) {
	return (b: TextEditorEdit) => {
		const reWords = /[A-Z]{2,}|[a-zA-Z][a-z]*/g;
		for (const selectionIt of selections) {
			const text = editor.document.getText(selectionIt);
			const norm: string[] = [];
			for (const [word] of text.matchAll(reWords)) {
				norm.push(word.toLowerCase());
			}
			norm.length && b.replace(selectionIt, dispatchNorm[wc](norm));
		}
	};
}

async function dispatchDetect() {
	const editor = vscode.window.activeTextEditor;
	if (!editor) {
		return;
	}
	const { selections } = editor;
	if (!selections.length) {
		return;
	}
	const text = editor.document.getText(selections[0]);
	const reWeChar = /(\/)|(\.)|(-)|(_)|( )/;
	const matches = text.match(reWeChar);

	let wordCase: WordCase;
	if (matches) {
		const idx = matches.findIndex((v, i) => v && i);
		switch (idx) {
			case 1:
				wordCase = 'pathCase';
				break;
			case 2:
				wordCase = 'dotCase';
				break;
			case 3:
				wordCase = 'paramCase';
				break;
			case 4:
				wordCase = 'snakeCase';
				break;
			case 5:
				wordCase = 'sentenceCase';
				break;
			default:
				wordCase = 'camelCase';
				break;
		}
		try {
			const picked = await showPickCase(wordCase);
			editor.edit(editSelections(editor, selections, picked));
		} catch {}
	}
}

export = {
	register,
};
