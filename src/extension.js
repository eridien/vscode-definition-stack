const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('extens');
const webv   = require('./webview.js');

function activate(context) {
  log("definition-stack activated");
  
  const openWebViewCmd = vscode.commands.registerCommand(
    'definition-stack.openwebview', 
    () => {
      try {
        webv.openWebView(context);
        log('web view opened');
      } catch (error) {
        log('error opening webview:', error);
      }
    }
  );
  
  const closeWebViewCmd = vscode.commands.registerCommand(
    'definition-stack.closewebview', 
    () => {
      webv.closeWebView();
      log('web view closed');  
    }
  );

  context.subscriptions.push(openWebViewCmd, closeWebViewCmd);
  log("commands registered");
}

function deactivate() {}

module.exports = { activate, deactivate }