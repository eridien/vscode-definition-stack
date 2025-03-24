const utils = require('./utils.js');
const log   = utils.getLog('COMM');

let webview = null;
let context = null;

let registeredRecvs = {};

function registerWebviewRecv(command, callback) {
  registeredRecvs[command] = callback;
}

registerWebviewRecv('error', async data => {
  log('err', 'from webview:', data);
});

async function init(contextIn, webviewIn) {
  webview = webviewIn;
  context = contextIn;
  const recvDisposable = webview.onDidReceiveMessage(async message => {
    const {command, data} = message;
    const callback = registeredRecvs[command];
    if(!callback) {
      log('err', 'Recv Message command not found:', {command, data});
      return;
    }
    // log('command from webview: ', {command, data});
    await callback(data);
  });
  context.subscriptions.push(recvDisposable);
}

async function send(command, data) {
  const message = {src:'extension', command, data};
  // log('Sending message to webview: ', command);
  await webview.postMessage(message);
}

module.exports = {init, send, registerWebviewRecv};

