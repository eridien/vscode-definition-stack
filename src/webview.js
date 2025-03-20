// console.log('loading webview module');

const vscode = require('vscode');
const blk    = require('./block.js');
const html   = require('./html.js');
const navi   = require('./navigate.js');
const comm   = require('./comm.js');
const utils  = require('./utils.js');
const log    = utils.getLog('WEBV');

let webviewPanel  = null;
let currentColumn = null;

async function init(context) {
  comm.registerWebviewRecv('openEditor', true, openEditor);
  await initWebview(context);
}

function inactiveColumn() {
  const editor = vscode.window.activeTextEditor;
  const activeColumn =  
          editor ? editor.viewColumn : vscode.ViewColumn.One;
  if(activeColumn === vscode.ViewColumn.Two)
    return vscode.ViewColumn.One;
  return vscode.ViewColumn.Two;
}

async function initWebview(context) {
  if(webviewPanel) webviewPanel.dispose();
  currentColumn = inactiveColumn();
  webviewPanel = vscode.window.createWebviewPanel(
    'defstack-webview',   
    'Definition Stack',   
     currentColumn,
    {
      enableFindWidget: true,
      retainContextWhenHidden: true,
      enableScripts: true
    }  
  );
  context.subscriptions.push(webviewPanel);
  webviewPanel.onDidDispose(() => {webviewPanel = null});
  await comm.init(context, webviewPanel.webview);
  await html.init(context, webviewPanel.webview);
  navi.init();
  blk.init();
}

async function openEditor(data) {
  const {filePath, lineNo} = data;
  let viewColumn;
  if(currentColumn === vscode.ViewColumn.Two)
    viewColumn = vscode.ViewColumn.One;
  else
    viewColumn = vscode.ViewColumn.Two;
  log('openEditor viewColumn:', viewColumn);
  try {
    const document = await vscode.workspace.openTextDocument(filePath);
    await vscode.window.showTextDocument(document, 
            { viewColumn, preserveFocus: false });
    if(lineNo !== undefined) {
      const line         = document.lineAt(+lineNo);
      const begOfLinePos = line.range.start;
      const range        = new vscode.Range(begOfLinePos, begOfLinePos);
      await vscode.window.activeTextEditor
                  .revealRange(range, vscode.TextEditorRevealType.InCenter);
    }
  } catch (error) {
    log('info', 'Failed to open file:', error.message);
  }
}

module.exports = { init };
