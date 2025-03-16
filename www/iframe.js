//////////////// definition stack iframe script //////////////////
  
  /* global window document Prism */

console.log('iframe started');

// debugger;

function send(command, data) {  
  // console.log('iframe sending to webview', {command, data});
  window.parent.postMessage({src:'iframe', command, data}, '*');
};

document.addEventListener('DOMContentLoaded', () => {
  send('ready', {});
});

function addBlock(blockHtml) {
  const tempDiv      = document.createElement('div');
  tempDiv.innerHTML  = blockHtml;
  const blockElement = tempDiv.firstElementChild;
  document.body.appendChild(blockElement);
  Prism.highlightAll();
}

function recv(command, data) {
  switch (command) {
    case 'addBlock': addBlock(data.blockHtml); break;
  }
}

// Listen for message from webview
window.addEventListener('message', event => {
  const message = event.data;
  // console.log('iframe received message from webview:', message);
  const {command, data} = message;
  recv(command, data);
});

document.addEventListener('click', event => {
  const ele = event.target;
  if (ele.classList.contains('ds-ref')) {
    event.preventDefault();
    const id = ele.getAttribute('id');
    console.log('Clicked:', {id});
    send('refClick', {id});
  }
});

// /* eslint-disable no-unused-vars */
// /* eslint-enable no-unused-vars */

