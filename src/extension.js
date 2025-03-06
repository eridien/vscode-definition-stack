const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('defStack');
const sym    = require('./symbols.js');
const webv   = require('./webview.js');

function activate(context) {
	log("started");
  
	const disptest = vscode.commands.registerCommand(
               'definition-stack.test', async function() {
    webv.createCustomView(context);

  //   const textEditor = vscode.window.activeTextEditor;
  //   if (!textEditor) return;
  //   const document  = textEditor.document;
  //   const selection = textEditor.selection; 

  //   await sym.processBlocks(document, selection);

    log('done');
	});

	context.subscriptions.push(disptest);
}

function deactivate() {}

module.exports = { activate, deactivate }