const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('editor');

let defStackEditor = null;

async function openTextEditor() {
  try {
    // close old def stack editor
    if(defStackEditor) {
      defStackEditor.hide();
      defStackEditor = null;
    }
    // Create an untitled document
    const uri = vscode.Uri.parse(`untitled:DefinitionStack`);
    const doc = await vscode.workspace.openTextDocument(uri);
    
    // Get the editor
    const editor = await vscode.window.showTextDocument(doc, {
      preview: true,
      viewColumn: vscode.ViewColumn.Beside,
      preserveFocus: true
    });
    return editor;
  } 
  catch (error) {
    log(`Failed to open editor: ${error.message}`);
    throw error;
  }
}

async function addText(text, position) {
  if (!text) return
  if(!defStackEditor) {
    defStackEditor = await openTextEditor();
    position = 'start';
  }
  if(position === 'start')
     position = new vscode.Position(0, 0);
  if(position === 'end') {
     const doc = defStackEditor.document;
     position  = new vscode.Position(doc.lineCount, 0);
  }
  // const pos = (position instanceof vscode.Position) 
  //     ? position 
  //     : new vscode.Position(position.line, position.character);
  await defStackEditor.edit(editBuilder => {
    editBuilder.insert(position, text);
  });
}

module.exports = { addText }
