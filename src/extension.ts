import type vscode = require('vscode');
const { register } = require('./api');

function activate(context: vscode.ExtensionContext) {
	console.log('My Extension activated.');
	register(context);
}
function deactivate() {
	console.log('My Extension deactivated.');
}

export = {
	activate,
	deactivate,
};
