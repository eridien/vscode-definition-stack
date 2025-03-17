// console.log('loading comm module');

const utils = require('./utils.js');
const log   = utils.getLog('COMM');

let webview = null;
let context = null;

let registeredRecvs = {};

function registerWebviewRecv(command, exclusive, callback) {
  if(exclusive) registeredRecvs[command] = [];
  registeredRecvs[command] ??= [];
  registeredRecvs[command].push(callback);
}

registerWebviewRecv('error', false, async data => {
  log('err', 'from webview:', data);
});

async function init(contextIn, webviewIn) {
  webview = webviewIn;
  context = contextIn;
  const recvDisposable = webview.onDidReceiveMessage(async message => {
    const {command, data} = message;
    const callbacks = registeredRecvs[command] ?? [];
    // log('command from webview: ', {command, data});
    for(const callback of callbacks) await callback(data);
  });
  context.subscriptions.push(recvDisposable);
}

async function send(command, data) {
  const message = {src:'extension', command, data};
  log('Sending message to webview: ', command);
  await webview.postMessage(message);
}

module.exports = {init, send, registerWebviewRecv};

