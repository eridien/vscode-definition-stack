const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.log('defStack');
const sym    = require('./symbols.js');

function activate(context) {
	log("started");
  
	const disptest = vscode.commands.registerCommand(
    'definition-stack.test', async function() {

    const textEditor = vscode.window.activeTextEditor;
    if (!textEditor) return;
    const document = textEditor.document;
    const selection = textEditor.selection; 

    log(await sym.findSymRefsInFunction(document, selection));

    log('done');
	});

	context.subscriptions.push(disptest);
}

function deactivate() {}

module.exports = { activate, deactivate }