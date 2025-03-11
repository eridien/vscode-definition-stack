const utils = require('./utils.js');
const log   = utils.getLog('COMM');

let webview = null;
let context = null;

const registeredRecvs = {};
function registerWebviewRecv(command, callback) {
  registeredRecvs[command] = callback;
}

async function init(webviewIn, contextIn) {
  webview = webviewIn;
  context = contextIn;
  const recvDisposable = webview.onDidReceiveMessage(message => {
    log('Received message from webview: ', message);
    const {command, data} = message;
    const callbacks = registeredRecvs[command] ?? [];
    for(const callback of callbacks) callback(data);
  });
  context.subscriptions.push(recvDisposable);
}

async function send(command, data) {
  const message = {src:'extension', command, data};
  log('Sending message to webview: ', message);
  await webview.postMessage(message);
}

module.exports = {init, send, registerWebviewRecv};

