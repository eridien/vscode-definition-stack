const vscode = require('vscode');
const html   = require('./html.js');

let webViewPanel = null;

function openEmptyPage(context) {
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
    webViewPanel.onDidDispose(() => {webViewPanel = null});
  }
  html.clearPage();
  html.showBusyAnimation();
}

async function addBanner(word, tgtPath) {
  const banner = 
    `Definition of <span style="color:red;">${word}</span> in ${tgtPath}`;
  html.add(banner);
}

async function addCode(code, lineNum) {
  html.add(code, lineNum, true);
}

const renderPage    = html.renderPage;
const showMsgInPage = html.showMsgInPage;

async function close() {
  if (webViewPanel) {
    webViewPanel.dispose();
    webViewPanel = null;
  }
}

module.exports = {openEmptyPage, addBanner, addCode, renderPage, showMsgInPage, close };
