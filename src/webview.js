const vscode = require('vscode');
const html   = require('./html.js');
const comm   = require('./comm.js');
// const utils  = require('./utils.js');
// const log    = utils.getLog('WEBV');

let webviewPanel  = null;

function inactiveColumn() {
  const editor = vscode.window.activeTextEditor;
  const activeColumn =  
          editor ? editor.viewColumn : vscode.ViewColumn.One;
  if(activeColumn === vscode.ViewColumn.Two)
    return vscode.ViewColumn.One;
  return vscode.ViewColumn.Two;
}

async function setWebView(context, editor) {
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
  comm.init(webviewPanel.webview, context);
  html.init(context, webviewPanel.webview);
  await html.setAllViewHtml(editor);
}

async function addBanner(word, tgtPath) {
  const banner = 
    `<span style="color:#444;">
     <span style="color:#f44;">${word}</span> in 
     <span style="color:#f44;">${tgtPath}</span></span>`;
  await html.addpre(banner);
}

async function addCode(code, lineNum) {
  await html.addpre(code, lineNum, true);
}

async function close() {
  if (webviewPanel) {
    webviewPanel.dispose();
    webviewPanel = null;
  }
}

module.exports = { setWebView, addBanner, addCode, close};
