const vscode = require('vscode');
// const utils = require('./utils.js');
// const log   = utils.getLog('webvew');
const html = require('./html.js');

let webViewPanel = null;

async function open(context) {
  // Create and show a new webview panel
  if (!webViewPanel) {
    webViewPanel = vscode.window.createWebviewPanel(
      'defstack-webview',   
      'Definition Stack',   
      vscode.ViewColumn.Two,
      {
        enableFindWidget: true,
        retainContextWhenHidden: true,
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(context.extensionPath)]
      }  
    );
    context.subscriptions.push(webViewPanel);
  }
  await html.init(context, webViewPanel.webview);
  html.render();
}

async function add(code) {
  if (!webViewPanel) return;
  html.add(code);
}

async function close() {
  if (webViewPanel) {
    webViewPanel.dispose();
    webViewPanel = null;
  }
}

module.exports = { open, add, close };
