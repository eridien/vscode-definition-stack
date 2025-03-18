//////////////// definition stack iframe script //////////////////
  
  /* global window document Prism */

console.log('iframe started');

debugger;

let dsBlocksElement;

document.addEventListener('DOMContentLoaded', () => {
  dsBlocksElement = document.getElementById('ds-blocks');
  send('ready', {});
});

document.addEventListener('click', event => {
  console.log('addEventListener click:', event);
  const ele = event.target;
  const classes = ele.classList;
  if (classes.contains('ref-span')) {
    event.preventDefault();
    const id = ele.getAttribute('id');
    console.log('ref clicked:', {id});
    send('refClick', {id});
  }
  if (classes.contains('ds-button')) {
    event.preventDefault();
    const id = ele.getAttribute('id');
    console.log('button clicked:', {id});
    send('buttonClick', {id});
  }
});

function eleFromHtml(html) {
  const tempDiv = document.createElement('template');
  tempDiv.innerHTML = html.trim();
  return tempDiv.content.firstChild;
}

async function insertBlock(blockHtml, index) {
  const children = dsBlocksElement.children;
  console.log('insertBlock:', index);
  if (index < 0 || index > children.length) {
    send('error', {msg:'insertBlock bad index', index});
    return;
  }
  const newBlk = eleFromHtml(blockHtml);
  if(children.length == 0 || index === undefined) {
    dsBlocksElement.appendChild(newBlk);
  } 
  else {
    if (index === children.length)
      dsBlocksElement.appendChild(newBlk);
    else 
      dsBlocksElement.insertBefore(newBlk, children[index]);
  }
  Prism.highlightAll();
}

async function moveBlock(fromIndex, toIndex){
  const children = dsBlocksElement.children;
  if (fromIndex < 0 || fromIndex >= children.length || 
      toIndex   < 0 || toIndex   >= children.length) {
    send('error', {msg:'moveBlock bad indices', fromIndex, toIndex});
    return;
  } 
  const fromEle = children[fromIndex];
  const toEle   = children[toIndex];
  if (toIndex > fromIndex) {
      dsBlocksElement.insertBefore(fromEle, toEle.nextSibling);
  } else {
      dsBlocksElement.insertBefore(fromEle, toEle);
  }
} 

async function removeBlock(blockId){
  document.getElementById(blockId)?.remove();
}      

// Listen for message from webview
window.addEventListener('message', event => {
  if(!dsBlocksElement) {
    send('Error, not ready', {});
    return;
  }
  const message = event.data;
  console.log('iframe received message from webview:', message);
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

