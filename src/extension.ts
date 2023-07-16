import vscode = require('vscode');
import caseTransform = require('./caseTransform');
import switchFile = require('./switchFile');
import tsCodeActions = require('./tsCodeActions');

function activate(context: vscode.ExtensionContext) {
	console.log('My Extension activated.');
	caseTransform.register(context);
	switchFile.register(context);
	tsCodeActions.register(context);
}

function deactivate() {
	console.log('My Extension deactivated.');
}

export = {
	activate,
	deactivate,
};
