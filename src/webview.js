const vscode = require('vscode');
const html   = require('./html.js');

let webViewPanel = null;

async function open(context, editor) {
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
  await html.init(context, webViewPanel.webview, editor);
}

async function addBanner(word, tgtPath) {
  const banner = `Definition of <span style="color:red;">${word}</span> in ${tgtPath}`;
  html.add(banner);
}

async function addCode(code, lineNum) {
  html.add(code, lineNum, true);
}

const render = html.render;

async function close() {
  if (webViewPanel) {
    webViewPanel.dispose();
    webViewPanel = null;
  }
}

module.exports = {open, addBanner, addCode, render, close };
