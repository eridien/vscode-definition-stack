
//////////////// definition stack iframe script //////////////////
  
  /* global console window document Prism requestAnimationFrame */

console.log('iframe started');

let scrollContainerEle;
let blocksContentEle;

document.addEventListener('DOMContentLoaded', () => {
  scrollContainerEle = document.getElementById('scroll-container');
  blocksContentEle   = document.getElementById('blocks-content');
  // watchForContainerChange();
  // watchForSelectionChange();
  watchForThemeSelChange();
  send('ready', {});
});

// setInterval(() => {
//   const scrollContainerHeight  = scrollContainerEle.getBoundingClientRect().height;
//   console.log('scrollContainerHeight:', scrollContainerHeight);
// }, 1000);

function watchForThemeSelChange() {
  const selectEle = document.getElementById("theme-select-hdr");
  selectEle.addEventListener("change", function () {
    console.log('themeSelChange:', selectEle.value);
    send('themeSelChange', {theme: selectEle.value});
  });
}

// function watchForSelectionChange() {
//   document.addEventListener("selectionchange", async () => {
//     const selection = window.getSelection().toString().trim();
//     if (selection) {
//       console.log('selection:', selection);
//       await navigator.clipboard.writeText("Text to copy");
//       // vscode.postMessage({
//       //   command: "selectionChanged",
//       //   text: selection
//       // });
//     }
//   });
// }
  
function blkIdFromId(id) {return id.split('-').splice(0, 3).join('-')}
function tailFromId(id) {return id.split('-').splice(3).join('-')}

function setStyle(ele, prop, val) {
  if(ele) ele.style[prop] = val;
}

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
  const rootEle = document.querySelector('[from-ref = "root"]');
  scrollBlockIntoView(rootEle);
}

function getTopElement(container, childSelector) {
  if (!container) {
    console.error('Container not found');
    return null;
  }
  const containerRect = container.getBoundingClientRect();
  const children      = container.querySelectorAll(childSelector);
  for (const childEle of children) {
    const childRect = childEle.getBoundingClientRect();
    if (childRect.top-6 <= containerRect.top &&
        childRect.bottom > containerRect.top) {
      return { topEle: childEle, 
         distTopToTop: Math.abs(childRect.top - containerRect.top)};
    }
  }
  return null;
}

async function up() {
  console.log('header up  click');
  const topRes = getTopElement(scrollContainerEle, '.ds-block');
  if(!topRes) { console.log('up, no top element'); return; }
  // console.log('up topRes:', topRes);
  const {topEle, distTopToTop} = topRes;
  let eleToMoveToTop;
  const blockAtTop = distTopToTop < 3;
  if(blockAtTop) eleToMoveToTop = topEle.previousElementSibling;
  else           eleToMoveToTop = topEle;
  if(eleToMoveToTop) scrollBlockIntoView(eleToMoveToTop);
}

async function down() {
  console.log('header down  click');
  const topRes = getTopElement(scrollContainerEle, '.ds-block');
  if(!topRes) { console.log('down, no top element'); return; }
  // console.log('down topRes:', topRes);
  const {topEle} = topRes;
  const eleToMoveToTop = topEle.nextElementSibling;
  if(eleToMoveToTop) scrollBlockIntoView(eleToMoveToTop);
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

function scrollBlockIntoView(ele) {
  if(!ele) { console.log('scrollBlockIntoView, ele not found'); return; }
  ele.scrollIntoView({
    behavior: 'auto', // 'smooth',
    block:    'start',     // Align the block with the top of the viewport
    inline:   'nearest'   // Keep horizontal alignment as is
  });
}

function scrollToBlkId(blockId) {
  let blkEle = document.getElementById(blockId);
  if(!blkEle) {
    console.log('scrollToBlockId, block not found:', blockId);
    return;
  }
  scrollBlockIntoView(blkEle);
}

function scrollToFromRef(fromRefId) {
  if(!fromRefId || fromRefId === 'root') return;
  let refEle = document.getElementById(fromRefId);
  const refTail = tailFromId(fromRefId);
  if(refTail.startsWith('ref')) {
    setFromRefHighlight(refEle);
    const refBlkId = blkIdFromId(fromRefId);
    refEle = document.getElementById(refBlkId);
    if(!refEle) {
      console.log('scrollToFromRef, ref block missing:', refBlkId);
      return;
    }
  }
  scrollBlockIntoView(refEle);
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

function bannerButtonClick(ele, id, blockId, tail) {
  console.log('bannerButtonClick:', {id, blockId, tail});
  switch(tail) {
    case 'icon-delete':   send('deleteButtonClick', {blockId}); break;
    case 'icon-collapse': collapse(blockId, ele);               break;
    case 'icon-expand':   expand(blockId, ele);                 break;
    case 'icon-refsup':   send('refsupClick', {blockId});       break;
    case 'icon-isolate':  send('isolateClick', {blockId});      break;
  }
}

function bannerNameClick(ele, bannerNameId) {
  console.log('bannerNameClick:', bannerNameId, ele.innerText);
  const anc = findAncestorByClass(ele, 'ds-block');
  if(!anc) return;
  const {ele:blkEle} = anc;
  const fromRefId = blkEle.getAttribute('from-ref');
  if(!fromRefId) console.log(
          'bannerNameClick, no fromRefId:', bannerNameId);
  else scrollToFromRef(fromRefId);
}

function bannerPathClick(ele, bannerPathId) {
  const blockId = blkIdFromId(bannerPathId);
  console.log('bannerPathClick:', bannerPathId);
  send('openEditor', {blockId});
}

function codeClick(blkEle) {
  const blockId = blkEle.id
  let lineNo  = +blkEle.querySelector('pre')
                        .getAttribute('data-start');
  lineNo -= 2;
  console.log('codeClick:', {blockId, lineNo});
  send('openEditor', {blockId, lineNo});
}

function setFromRefHighlight(refEle) {
  const {ele:blkEle} = findAncestorByClass(refEle, 'ds-block');
  const lastClickedEles = blkEle.querySelectorAll('.ref-last-clicked');
  for(const lastClickedEle of lastClickedEles) 
    lastClickedEle.classList.remove('ref-last-clicked');
  refEle.classList.add('ref-last-clicked');
}

function refClick(ele, refId) {
  console.log('refClick:', refId, ele.innerText);
  setFromRefHighlight(ele);
  send('refClick', {refId});
}

function findAncestorByClass(ele, klass) {
  if(!ele) return null;
  ele = ele.closest(`.${klass}`);
  if(!ele) {
    console.log('findAncestorByClass, class not found:', klass);
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
  let blkEle;
  if      (classes.contains('banner-name'))   bannerNameClick(ele, id);
  else if (classes.contains('banner-path'))   bannerPathClick(ele, id);
  else if (classes.contains('ref-span'))      refClick(ele, id);
  else if (blkEle = ele.closest(".ds-block")) codeClick(blkEle);
});

function eleFromHtml(html) {
  const tempDiv = document.createElement('template');
  // console.log('eleFromHtml:', html);
  tempDiv.innerHTML = html;
  return tempDiv.content.firstChild;
}

async function insertBlock(blockHtml, toIndex) {
  const children = blocksContentEle.children;
  if(toIndex === undefined) toIndex = children.length-1;
  console.log('insertBlock toIndex:', toIndex);
  if (toIndex < 0 || toIndex > children.length) {
    send('error', {msg:'insertBlock bad index', index: toIndex});
    return;
  }
  const newBlk = eleFromHtml(blockHtml);
  if(children.length == 0 || toIndex === children.length) {
    blocksContentEle.appendChild(newBlk);
  } 
  else blocksContentEle.insertBefore(newBlk, children[toIndex]);
  scrollBlockIntoView(children[toIndex]);
  Prism.highlightAllUnder(newBlk, false, () => {
    // console.log('Prism highlight done', newBlk.id);
  });
}

async function moveBlock(fromIndex, toIndex){
  const children = blocksContentEle.children;
  if (fromIndex < 0 || fromIndex >= children.length || 
      toIndex   < 0 || toIndex   >  children.length) {
    send('error', {msg:'moveBlock bad indices', fromIndex, toIndex});
    return;
  } 
  const fromEle = children[fromIndex];
  if(toIndex == children.length) blocksContentEle.appendChild(fromEle);
  else blocksContentEle.insertBefore(fromEle, children[toIndex]);
  scrollBlockIntoView(fromEle);
} 

async function deleteBlock(blockId){
  document.getElementById(blockId)?.remove();
}      

const cmdQueue = [];

async function cmdLoop() {
  if(cmdQueue.length > 0) {
    const cmd = cmdQueue.shift();
    const {command, data} = cmd;
    switch (command) {
      case 'insertBlock':   await insertBlock(data.blockHtml, data.toIndex); break;
      case 'moveBlock':     await moveBlock(data.fromIndex, data.toIndex);   break;
      case 'deleteBlock':   await deleteBlock(data.blockId);                 break;
      case 'scrollToBlkId': await scrollToBlkId(data.blockId);               break;
    }
  }
  requestAnimationFrame(cmdLoop);
}
requestAnimationFrame(cmdLoop);

// Listen for message from webview
window.addEventListener('message', event => {
  const message = event.data;
  // console.log('iframe, message from webview:', message);
  cmdQueue.push(message);
});

function send(command, data) {  
  // console.log('iframe sending to webview', {command, data});
  window.parent.postMessage({src:'iframe', command, data}, '*');
};
