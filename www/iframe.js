//////////////// definition stack iframe script //////////////////
  
  /* global window document Prism */

console.log('iframe started');

// debugger;

let dsBlocksElement;

document.addEventListener('DOMContentLoaded', () => {
  dsBlocksElement = document.getElementById('ds-blocks');
  send('ready', {});
});

function addBlock(blockHtml) {
  const tempDiv      = document.createElement('div');
  tempDiv.innerHTML  = blockHtml;
  const blockElement = tempDiv.firstElementChild;
  document.body.appendChild(blockElement);
  Prism.highlightAll();
}

document.addEventListener('click', event => {
  const ele = event.target;
  if (ele.classList.contains('ref-span')) {
    event.preventDefault();
    const id = ele.getAttribute('id');
    console.log('ref clicked:', {id});
    send('refClick', {id});
  }
  if (ele.classList.contains('ds-block')) {
    event.preventDefault();
    const id = ele.getAttribute('id');
    console.log('block clicked:', {id});
    send('blkClick', {id});
  }
});

// Listen for message from webview
window.addEventListener('message', event => {
  const message = event.data;
  // console.log('iframe received message from webview:', message);
  const {command, data} = message;
  switch (command) {
    case 'insertBlock': insertBlock(data.blockHtml, data.index); break;
    case 'moveBlock':   moveBlock(data.fromIdx, data.toIndex);   break;
    case 'removeBlock': removeBlock(data.blockId);               break;
  }
});

function send(command, data) {  
  // console.log('iframe sending to webview', {command, data});
  window.parent.postMessage({src:'iframe', command, data}, '*');
};

// /* eslint-disable no-unused-vars */
// /* eslint-enable no-unused-vars */

