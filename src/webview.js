const vscode = require('vscode');

function createCustomView(context) {
  // Create and show a new webview panel
  const panel = vscode.window.createWebviewPanel(
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
  panel.webview.html = getWebviewContent();
}

function getWebviewContent() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>My Custom View</title>
    </head>
    <body>
      <h1>Hello from your custom view!</h1>
      <p>This view isn’t a document—it’s a webview panel.</p>
    </body>
    </html>`;
}

module.exports = { createCustomView };
