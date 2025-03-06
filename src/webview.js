const vscode = require('vscode');
 
// const utils = require('./utils.js');
// const log   = utils.getLog('webvew');
const html  = require('./html.js');

let webViewPanel = null;

async function openWebView(context) {
  // Create and show a new webview panel
  if (!webViewPanel) {
    webViewPanel = vscode.window.createWebviewPanel(
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
    context.subscriptions.push(webViewPanel);
  }
  webViewPanel.webview.html = html.getHtml();
}

async function closeWebView() {
  if (webViewPanel) {
    webViewPanel.dispose();
    webViewPanel = null;
  }
}

// function getHtml() {
//   return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8">
//       <title>My Custom View</title>
//     </head>
//     <body>
//       <h1>Hello from your custom view!</h1>
//       <p>This view isn’t a document—it’s a webview panel.</p>
//     </body>
//     </html>`;
// }

module.exports = { openWebView, closeWebView };
