const vscode = require('vscode');
const html   = require('./html.js');
const utils  = require('./utils.js');
const log    = utils.getLog('WEBV');

let webviewPanel  = null;

function activeColumn() {
  const editor = vscode.window.activeTextEditor;
  return editor ? editor.viewColumn : vscode.ViewColumn.One;
}

function inactiveColumn() {
  if(activeColumn() === vscode.ViewColumn.Two)
    return vscode.ViewColumn.One;
  return vscode.ViewColumn.Two;
}

async function openEmptyPage(context) {
  if(!webviewPanel) {
    webviewPanel = vscode.window.createWebviewPanel(
      'defstack-webview',   
      'Definition Stack',   
       inactiveColumn(),
      {
        enableFindWidget: true,
        retainContextWhenHidden: true,
        enableScripts: true,
        localResourceRoots: [vscode.Uri.file(context.extensionPath)]
      }  
    );
    context.subscriptions.push(webviewPanel);
    html.setView(context, webviewPanel.webview);
    webviewPanel.onDidDispose(() => {webviewPanel = null});
  }
  if(!webviewPanel.active && 
      webviewPanel.viewColumn === activeColumn()) {
    webviewPanel.dispose();
    webviewPanel = null;
    openEmptyPage(context);
    return;
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
  if (webviewPanel) {
    webviewPanel.dispose();
    webviewPanel = null;
  }
}

module.exports = {openEmptyPage, addBanner, addCode, 
                  renderPage, showMsgInPage, close};
