//////////////// definition stack iframe script //////////////////
  
  /* global window document Prism */

console.log('iframe started');

// debugger;

let dsBlocksElement;

document.addEventListener('DOMContentLoaded', () => {
  dsBlocksElement = document.getElementById('ds-blocks');
  send('ready', {});
});

document.addEventListener('click', event => {
  // console.log('addEventListener:', event);
  const tagName = event.target.tagName.toLowerCase(); 
  if (["path", "svg"].includes(tagName)) {
    let ele = event.target.parentElement;
    while (ele && !ele.classList.contains('button')) 
                   ele = ele.parentElement;
    if (!ele) return;
    const id = ele.getAttribute('id');
    // console.log('button click:', id);
    send('buttonClick', {id});
    return;
  }
  const ele = event.target;
  const classes = ele.classList;
  if (classes.contains('ref-span')) {
    const id = ele.getAttribute('id');
    // console.log('ref clicked:', id);
    send('refClick', {id});
  }
});

function eleFromHtml(html) {
  const tempDiv = document.createElement('template');
  tempDiv.innerHTML = html.trim();
  return tempDiv.content.firstChild;
}

async function insertBlock(blockHtml, toIndex) {
  const children = dsBlocksElement.children;
  if(toIndex === undefined) toIndex = children.length;
  console.log('insertBlock:', toIndex);
  if (toIndex < 0 || toIndex > children.length) {
    send('error', {msg:'insertBlock bad index', index: toIndex});
    return;
  }
  const newBlk = eleFromHtml(blockHtml);
  if(children.length == 0 || toIndex === children.length) {
    dsBlocksElement.appendChild(newBlk);
  } 
  else dsBlocksElement.insertBefore(newBlk, children[toIndex]);
  Prism.highlightAll();
}

async function moveBlock(fromIndex, toIndex){
  const children = dsBlocksElement.children;
  if (fromIndex < 0 || fromIndex >= children.length || 
      toIndex   < 0 || toIndex   >  children.length) {
    send('error', {msg:'moveBlock bad indices', fromIndex, toIndex});
    return;
  } 
  const fromEle = children[fromIndex];
  if(toIndex == children.length) {
    dsBlocksElement.appendChild(fromEle);
    return;
  }
  const toEle = children[toIndex];
  if (toIndex > fromIndex) {
      dsBlocksElement.insertBefore(fromEle, toEle);
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
    case 'insertBlock': insertBlock(data.blockHtml, data.toIndex); break;
    case 'moveBlock':   moveBlock(data.fromIndex, data.toIndex);   break;
    case 'removeBlock': removeBlock(data.blockId);               break;
  }
});

function send(command, data) {  
  // console.log('iframe sending to webview', {command, data});
  window.parent.postMessage({src:'iframe', command, data}, '*');
};

// /* eslint-disable no-unused-vars */
// /* eslint-enable no-unused-vars */

