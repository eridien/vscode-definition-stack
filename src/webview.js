const vscode = require('vscode');
const html   = require('./html.js');
const utils  = require('./utils.js');
const log    = utils.getLog('WEBV');

let webviewPanel  = null;

function inactiveColumn() {
  const editor = vscode.window.activeTextEditor;
  const activeColumn =  
          editor ? editor.viewColumn : vscode.ViewColumn.One;
  if(activeColumn === vscode.ViewColumn.Two)
    return vscode.ViewColumn.One;
  return vscode.ViewColumn.Two;
}

async function openEmptyPage(context) {
  if(webviewPanel) webviewPanel.dispose();
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
  webviewPanel.onDidDispose(() => {webviewPanel = null});
  html.setView(context, webviewPanel.webview);
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

const setLanguage   = html.setLanguage;
const renderPage    = html.renderPage;
const showMsgInPage = html.showMsgInPage;

async function close() {
  if (webviewPanel) {
    webviewPanel.dispose();
    webviewPanel = null;
  }
}

module.exports = {setLanguage, openEmptyPage, addBanner, addCode, 
                  renderPage, showMsgInPage, close};
