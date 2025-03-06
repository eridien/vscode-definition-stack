const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('defStack');
const sym    = require('./symbols.js');
const webv   = require('./webview.js');

function activate(context) {
	log("definition-stack activated");
  
	const openWebViewCmd = 
    vscode.commands.registerCommand(
     'definition-stack.openWebView', 
      async function() {
        await webv.openWebView(context);
        context.subscriptions.push(openWebViewCmd);
        // sym.processBlocks();
        log('web view opened');  
      }	
  );

  const closeWebViewCmd = 
    vscode.commands.registerCommand(
     'definition-stack.closeWebView', 
      async function() {
        await webv.closeWebView();
        context.subscriptions.push(closeWebViewCmd);
        log('web view closed');  
      }
  );
}

function deactivate() {}

module.exports = { activate, deactivate }