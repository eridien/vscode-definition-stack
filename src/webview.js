const vscode = require('vscode');
const html   = require('./html.js');

let webViewPanel = null;

function createWebView(context) {
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
    html.setView(context, webViewPanel.webview);
  }
}

async function startPage(context, editor) {
  createWebView(context);
  html.showBusyAnimation();
  await html.initPage(editor);
}

async function addBanner(word, tgtPath) {
  const banner = `Definition of <span style="color:red;">${word}</span> in ${tgtPath}`;
  html.add(banner);
}

async function addCode(code, lineNum) {
  html.add(code, lineNum, true);
}

const renderPage = html.renderPage;

async function close() {
  if (webViewPanel) {
    webViewPanel.dispose();
    webViewPanel = null;
  }
}

module.exports = {startPage, addBanner, addCode, renderPage, close };
