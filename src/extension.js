const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('extens');
const sym    = require('./symbols.js');
const webv   = require('./webview.js');

async function activate(context) {
  log("definition-stack activated");
  
	const openWebViewCmd = 
    vscode.commands.registerCommand(
     'definition-stack.openwebview', 
      function() {
        const textEditor = vscode.window.activeTextEditor;
        if (!textEditor) return;
        webv.open(context, textEditor);
        const document   = textEditor.document;
        const selection  = textEditor.selection; 
        sym.processBlocks(document, selection);
        log('web view opened');  
      }	
  );

  const closeWebViewCmd = 
    vscode.commands.registerCommand(
     'definition-stack.closewebview', 
      function() {
        webv.close();
        log('web view closed');  
      }
  );

  // const languages = await vscode.languages.getLanguages();
  // const workspaceFolders = vscode.workspace.workspaceFolders;
  // if (!workspaceFolders) {
  //   vscode.window.showErrorMessage('No workspace folder open');
  //   return;
  // }
  // const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, 'vscode-languages.txt');
  // const data = 
  // new Uint8Array(Buffer.from(languages.join('\n')));
  // await vscode.workspace.fs.writeFile(filePath, data);
  
  context.subscriptions.push(openWebViewCmd, closeWebViewCmd);
  log("commands registered");
}

function deactivate() {}

module.exports = { activate, deactivate }