import vscode = require('vscode');
import type { CodeActionProvider, Disposable, DocumentSelector } from 'vscode';

const myCommands = {
	deleteFunctionCall: 'my-extension.action.deleteFunctionCall',
};
const tsSelector: DocumentSelector = [
	'typescript',
	'javascript',
	'typescriptreact',
	'javascriptreact',
];

const tsCodeActionProvider: CodeActionProvider = {
	provideCodeActions(
		document: vscode.TextDocument,
		range: vscode.Range | vscode.Selection,
		context: vscode.CodeActionContext,
		token: vscode.CancellationToken
	): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
		throw new Error('Method not implemented.');
	},
	resolveCodeAction(
		codeAction: vscode.CodeAction,
		token: vscode.CancellationToken
	): vscode.ProviderResult<vscode.CodeAction> {
		throw new Error('Method not implemented.');
	},
};

function register() {
	const disposables: Disposable[] = [];
	disposables.push(
		vscode.languages.registerCodeActionsProvider(tsSelector, tsCodeActionProvider, {
			providedCodeActionKinds: [
				vscode.CodeActionKind.RefactorRewrite.append('function'),
			],
		}),
		vscode.commands.registerCommand(myCommands.deleteFunctionCall, () => {})
	);
	return disposables;
}

export = { register };
