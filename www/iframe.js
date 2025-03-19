//////////////// definition stack iframe script //////////////////
  
  /* global window document Prism */

console.log('iframe started');

debugger;

let dsBlocksElement;

document.addEventListener('DOMContentLoaded', () => {
  dsBlocksElement = document.getElementById('ds-blocks');
  send('ready', {});
});

function blkIdFromId(id) {return id.split('-').splice(0, 3).join('-')}
function tailFromId(id) {return id.split('-').splice(3).join('-')}
function setStyle(ele, prop, val) {ele.style[prop] = val}

function collapse(blkId, collapseBtnEle) {
  console.log('collapse', blkId);
  const preEle       = document.getElementById(`${blkId}-pre`);
  const expandBtnEle = collapseBtnEle.previousElementSibling;
  setStyle(preEle,         'display', 'none');
  setStyle(collapseBtnEle, 'display', 'none');
  setStyle(expandBtnEle,   'display', 'inline-block');
}

async function expand(blkId, expandBtnEle) {
  console.log('expand', blkId);
  const preEle         = document.getElementById(`${blkId}-pre`);
  const collapseBtnEle = expandBtnEle.nextElementSibling;
  setStyle(preEle,         'display', 'block');
  setStyle(expandBtnEle,   'display', 'none');
  setStyle(collapseBtnEle, 'display', 'inline-block');
}

async function home() {
  console.log('header home click');
}
async function up() {
  console.log('header up  click');
}
async function down() {
  console.log('header down  click');
}

async function expandAll() {
  // console.log('header expandAll click');
  const blkEles = document.querySelectorAll('.ds-block');
  for(const blkEle of blkEles) {
    const blkId = blkEle.getAttribute('id');
    const expandBtnEle = document.getElementById(`${blkId}-icon-expand`);
    expand(blkId, expandBtnEle);
  }
}

async function collapseAll() {
  // console.log('header collapseAll click');
  const blkEles = document.querySelectorAll('.ds-block');
  for(const blkEle of blkEles) {
    const blkId = blkEle.getAttribute('id');
    const collapseBtnEle = document.getElementById(`${blkId}-icon-collapse`);
    collapse(blkId, collapseBtnEle);
  }
}

function headerButtonClick(iconName) {
  switch(iconName) {
    case 'home':     home();        break;
    case 'up-ptr':   up();          break;
    case 'down-ptr': down();        break;
    case 'expand':   expandAll();   break;
    case 'collapse': collapseAll(); break;
  }
}

function bannerButtonClick(ele, id, blkId, tail) {
  switch(tail) {
    case 'icon-collapse': collapse(blkId, ele); break;
    case 'icon-expand':   expand(blkId, ele);   break;
    default: send('closeButtonClick', {blkId});         break;
  }
}

function bannerNameClick(ele, bannerNameId) {
  console.log('bannerNameClick:', bannerNameId, ele.innerText);

}

function bannerPathClick( ele, bannerPathId) {
  console.log('bannerPathClick:', bannerPathId, ele.innerText);

}

function findAncestorByClass(ele, klass) {
  while (ele && !ele.classList.contains(klass))
                 ele = ele.parentElement;
  if(!ele) {
    console.log('findParentByClass, class not found:', klass);
    return null;
  }
  const id    = ele.getAttribute('id');
  const blkId = blkIdFromId(id);
  const tail  = tailFromId(id);
  return {ele, id, blkId, tail};
}

document.addEventListener('click', event => {
  let   ele     = event.target;
  const tagName = ele.tagName.toLowerCase(); 
  const id      = ele.getAttribute('id');
  console.log('click event:', tagName, id);
  if (["path", "svg", "polygon", "polyline"].includes(tagName)) {
    const ancestor = findAncestorByClass(event.target, 'button');
    const {ele, id, blkId, tail} = ancestor;
    console.log('button click:', {blkId, tail});
    if(blkId == "iframe-hdr-icon")
         headerButtonClick(tail);
    else bannerButtonClick(ele, id, blkId, tail);
    return;
  }
  const classes = ele.classList;
  if      (classes.contains('banner-name')) bannerNameClick(ele, id);
  else if (classes.contains('banner-path')) bannerPathClick(ele, id);
  else if (classes.contains('ref-span'))    send('refClick', {id});
  else console.error('unknown click event:', tagName, id);
});

function eleFromHtml(html) {
  const tempDiv = document.createElement('template');
  tempDiv.innerHTML = html.trim();
  return tempDiv.content.firstChild;
}

async function insertBlock(blockHtml, toIndex) {
  const children = dsBlocksElement.children;
  if(toIndex === undefined) toIndex = children.length;
  console.log('insertBlock toIndex:', toIndex);
  if (toIndex < 0 || toIndex > children.length) {
    send('error', {msg:'insertBlock bad index', index: toIndex});
    return;
  }
  const newBlk = eleFromHtml(blockHtml);
  console.log('insertBlock newBlk innerHTML:', newBlk.innerHTML);
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

