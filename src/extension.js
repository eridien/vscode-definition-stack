const vscode = require('vscode');
const page    = require('./page.js');
const webv   = require('./webview.js');
const utils  = require('./utils.js');
const log    = utils.getLog('EXTS');

async function activate(context) {
  log("definition-stack activated");
  
	const openWebViewCmd = 
    vscode.commands.registerCommand(
     'definition-stack.openwebview', 
      async function() {
        const textEditor = vscode.window.activeTextEditor;
        if (!textEditor) return;
        await webv.openEmptyPage(context, textEditor);
        await page.startBuildingPage(context, textEditor);
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