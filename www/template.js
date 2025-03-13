document.addEventListener('DOMContentLoaded', () => {
  const vscode = acquireVsCodeApi();
  const iframe = document.getElementById('defStackIframe');
  console.log('webview started, iframe:', iframe);

  // Receive a message from anywhere
  window.addEventListener('message', event => {
    const message = event.data;
    // console.log('webview received message:', message);
    if(message.src === 'extension') {
      // console.log('Received message from extension:', message);
      // post the message to the iframe
      message.src = 'webview';
      iframe.contentWindow.postMessage(message, '*');
      return;
    }
    if(message.src === 'iframe') {
      // console.log('Received message from iframe:', message);
      // post the message to the extension
      message.src = 'webview';
      vscode.postMessage(message);
      return;
    }
  });
});
