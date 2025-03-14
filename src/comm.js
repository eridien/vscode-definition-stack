// const utils = require('./utils.js');
// const log   = utils.getLog('COMM');

let webview = null;
let context = null;

let registeredRecvs = {};
function registerWebviewRecv(command, callback) {
  // log('registerWebviewRecv', command);
  registeredRecvs[command] ??= [];
  registeredRecvs[command].push(callback);
}

function clearRecvCallbacks() {
  registeredRecvs = {};
}

async function init(contextIn, webviewIn) {
  webview = webviewIn;
  context = contextIn;
  const recvDisposable = webview.onDidReceiveMessage(async message => {
    // log('Received message from webview: ', message);
    const {command, data} = message;
    const callbacks = registeredRecvs[command] ?? [];
    for(const callback of callbacks) await callback(data);
  });
  context.subscriptions.push(recvDisposable);
}

async function send(command, data) {
  const message = {src:'extension', command, data};
  // log('Sending message to webview: ', message);
  await webview.postMessage(message);
}

module.exports = {init, send, registerWebviewRecv, clearRecvCallbacks};

