const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('extens');
const sym    = require('./symbols.js');
const webv   = require('./webview.js');

async function activate(context) {
  log("definition-stack activated");
  
	const openWebViewCmd = 
    vscode.commands.registerCommand(
     'definition-stack.openwebview', 
      async function() {
        const textEditor = vscode.window.activeTextEditor;
        if (!textEditor) return;
        await webv.startPage(context, textEditor);
        await sym.startGeneratingPage(context, textEditor);
        log('web view loaded');  
      }	
  );

  const closeWebViewCmd = 
    vscode.commands.registerCommand(
     'definition-stack.closewebview', 
      function() {
        webv.close();
        log('web view closed');  
      }
  );
  
  context.subscriptions.push(openWebViewCmd, closeWebViewCmd);
  log("commands registered");
}

function deactivate() {}

module.exports = { activate, deactivate }