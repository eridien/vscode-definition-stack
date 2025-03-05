const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('editor');

let defStackEditor  = null;
let disposableWatch = null;

async function openTextEditor() {
  try {
    if(defStackEditor) await closeEditor();
    const uri = vscode.Uri.parse(`untitled:DefinitionStack`);
    const doc = await vscode.workspace.openTextDocument(uri);
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

async function clearEditor() {
  if(defStackEditor) {
    const document = defStackEditor.document;
    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, 
          new vscode.Range(0, 0, document.lineCount, 0), 
          '');
    await vscode.workspace.applyEdit(edit);
  }
}

async function closeEditor() {
  if(disposableWatch) {
    disposableWatch.dispose();
    disposableWatch = null;
  }
  if(!defStackEditor) return;
  await vscode.window.showTextDocument(defStackEditor.document);
  await vscode.commands.executeCommand(
                  'workbench.action.closeActiveEditor');
  log(`Editor closed`);
  defStackEditor = null;
}

function watchForEditorClose() {
  if(disposableWatch) return;
  disposableWatch = vscode.window
        .onDidChangeVisibleTextEditors(async (editors) => {
    if(!defStackEditor) return;
    const editorIsVisible = 
        editors.some(editor => editor === defStackEditor);
    if (!editorIsVisible) await closeEditor();
  });
}

async function addText(text, position) {
  if(!defStackEditor) {
    defStackEditor = await openTextEditor();
    watchForEditorClose();
    await clearEditor();
    position = 'start';
  }
  if(position === 'start')
     position = new vscode.Position(0, 0);
  if(position === 'end') {
     const doc = defStackEditor.document;
     position  = new vscode.Position(doc.lineCount, 0);
  }
  await defStackEditor.edit(editBuilder => {
    editBuilder.insert(position, text);
  });
}

  
module.exports = {clearEditor, addText}
