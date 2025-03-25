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
  comm.registerWebviewRecv('openEditor', openEditor);
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
      enableScripts: true,
      enableCommandUris: true,
      localResourceRoots: [vscode.Uri.file(context.extensionPath)]
    }  
  );
  context.subscriptions.push(webviewPanel);
  webviewPanel.onDidDispose(() => {webviewPanel = null});
  await comm.init(context, webviewPanel.webview);
  await html.init(context, webviewPanel.webview);
  navi.init();
  blk.init();
}

function revealAndHighlightLine(editor, lineNumber) {
  const position = new vscode.Position(lineNumber+1, 0);
  const range = new vscode.Range(position, position);
  editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
  const highlightDecoration = vscode.window
          .createTextEditorDecorationType({
              backgroundColor: "rgba(255,255,0,0.3)",
              isWholeLine: true,
          });
  editor.setDecorations(highlightDecoration, [range]);
  setTimeout(() => {
      editor.setDecorations(highlightDecoration, []);
  }, 2000);
}

async function openEditor(data) {
  const {blockId, lineNo} = data;
  let viewColumn;
  if(currentColumn === vscode.ViewColumn.Two)
       viewColumn = vscode.ViewColumn.One;
  else viewColumn = vscode.ViewColumn.Two;
  try {
    const document = await vscode.workspace
            .openTextDocument(blk.getPathByBlkId(blockId));
    await vscode.window.showTextDocument(document, 
            { viewColumn, preserveFocus: false });
    if(lineNo !== undefined) {
      const line   = document.lineAt(lineNo);
      const editor = vscode.window.activeTextEditor;
      revealAndHighlightLine(editor, line.lineNumber);
    }
  } catch (error) {
    log('info', 'Failed to open file:', error.message);
  }
}

module.exports = { init };
