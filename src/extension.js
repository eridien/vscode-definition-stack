const vscode = require('vscode');
const sym = require('./symbols.js');

function activate(context) {

	console.log("definition-stack started");

	const disptest = vscode.commands.registerCommand(
    'definition-stack.test', async function () {

    const textEditor = vscode.window.activeTextEditor;
    if (!textEditor) { return; }
    const document = textEditor.document;
    const selection = textEditor.selection; 
    console.log(await 
      sym.findSurroundingFunction( document, selection));
    console.log('test done');
		vscode.window.showInformationMessage('test done');
	});

	context.subscriptions.push(disptest);
}

function deactivate() {}

module.exports = { activate, deactivate }