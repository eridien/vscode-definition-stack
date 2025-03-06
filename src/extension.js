const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('extens');
// const sym    = require('./symbols.js');
const webv   = require('./webview.js');

function activate(context) {
	log("definition-stack activated");
  
	const openWebViewCmd = 
    vscode.commands.registerCommand(
     'definition-stack.openwebview', 
      async function() {
        await webv.openWebView(context);
        context.subscriptions.push(openWebViewCmd);
        // sym.processBlocks();
        log('web view opened');  
      }	
  );

  const closeWebViewCmd = 
    vscode.commands.registerCommand(
     'definition-stack.closewebview', 
      async function() {
        await webv.closeWebView();
        context.subscriptions.push(closeWebViewCmd);
        log('web view closed');  
      }
  );
}

function deactivate() {}

module.exports = { activate, deactivate }