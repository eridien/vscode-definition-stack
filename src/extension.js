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
        await webv.setWebView(context, textEditor);
        page.startBuildingPageWhenReady(context, textEditor);
        log('openWebViewCmd finished');  
      }	
  );
  
  context.subscriptions.push(openWebViewCmd);
  log("commands registered");
}

function deactivate() {}

module.exports = { activate, deactivate }