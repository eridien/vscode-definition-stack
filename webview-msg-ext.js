// Extension code (e.g., in extension.js)
const vscode = require('vscode');

function createWebview() {
  const panel = vscode.window.createWebviewPanel(
    'myWebview',               // Identifies the type of the webview.
    'My Webview',              // Title of the panel.
    vscode.ViewColumn.One,     // Editor column to show the webview.
    {
      enableScripts: true      // Allow scripts in the webview.
    }
  );

  // Set the HTML content for the webview.
  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>My Webview</title>
      </head>
      <body>
        <h1>Hello from the Webview!</h1>
        <button id="sendButton">Send Message to Extension</button>
        <script>
          const vscode = acquireVsCodeApi();
          
          // Listen for messages from the extension.
          window.addEventListener('message', event => {
            const message = event.data;
            console.log('Received from extension:', message);
            if (message.command === 'update') {
              document.body.insertAdjacentHTML('beforeend', '<p>Update received: ' + message.data + '</p>');
            }
          });
          
          // Send a message to the extension when the button is clicked.
          document.getElementById('sendButton').addEventListener('click', () => {
            vscode.postMessage({ command: 'alert', text: 'Hello from the webview!' });
          });
        </script>
      </body>
    </html>
  `;

  // Listen for messages sent from the webview.
  panel.webview.onDidReceiveMessage(message => {
    switch (message.command) {
      case 'alert':
        vscode.window.showInformationMessage(message.text);
        break;
      // Add more message types as needed.
    }
  });

  // Example: Send a message from the extension to the webview after 3 seconds.
  setTimeout(() => {
    panel.webview.postMessage({ command: 'update', data: 'This is an update from the extension!' });
  }, 3000);
}

module.exports = { createWebview };
