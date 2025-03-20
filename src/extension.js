// console.log('loading extension module');

const vscode = require('vscode');
const webv   = require('./webview.js');
const blk    = require('./block.js');
const utils  = require('./utils.js');
const log    = utils.getLog('EXTS');

async function activate(context) {
  log("definition-stack activated");
  
	const openWebViewCmd = 
    vscode.commands.registerCommand(
     'definition-stack.openwebview', 
      async function() {
        const textEditor = vscode.window.activeTextEditor;
        if (!textEditor) return;
        await webv.init(context, textEditor);
        await blk.showFirstBlockWhenReady(context, textEditor);
        log('openWebViewCmd finished');  
      }	
  );
  
  context.subscriptions.push(openWebViewCmd);
  log("commands registered");
}

function deactivate() {}

module.exports = { activate, deactivate }