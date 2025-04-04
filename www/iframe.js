
//////////////// definition stack iframe script //////////////////
  
  /* global console setInterval window document Prism requestAnimationFrame */

console.log('iframe started');

let htmlEle;
let iframeHeaderEle;
let themeSelectEle;
let colorPickerEle;
let colorSelPickerEle;
let scrollContainerEle;
let blocksContentEle;
let padBlockEle;

let lastScrollContHeight = 0;

function setRefColorsFromPickers() {
  const colorPickerVal = colorPickerEle.value;
  let refEles = blocksContentEle.querySelectorAll(".ref-span");
  for(const refEle of refEles) refEle.style.backgroundColor = colorPickerVal;
  const colorSelPickerVal = colorSelPickerEle.value;
  refEles = blocksContentEle.querySelectorAll(".ref-last-clicked");
  for(const refEle of refEles) refEle.style.backgroundColor = colorSelPickerVal;
}


document.addEventListener('DOMContentLoaded', () => {
  htmlEle            = document.querySelector("html");
  iframeHeaderEle    = document.getElementById("iframe-header");
  themeSelectEle     = document.getElementById("theme-select-hdr");
  colorPickerEle     = document.getElementById("ref-color");
  colorSelPickerEle  = document.getElementById("ref-sel-color");
  scrollContainerEle = document.getElementById('scroll-container');
  blocksContentEle   = document.getElementById('blocks-content');
  padBlockEle        = document.getElementById('padding-block');

  themeSelectEle.addEventListener("change", function () {
    const theme = themeSelectEle.value;
    // console.log('theme sel value change:', theme);
    send('themeSelChange', {theme});
  });

  colorPickerEle.addEventListener("input", function () {
    const colorPickerVal = colorPickerEle.value;
    console.log('colorPickerVal value change:', colorPickerVal);
    setRefColorsFromPickers();
    send('colorPickerValChg', {colorPickerVal});
  });

  colorSelPickerEle.addEventListener("input", function () {
    const colorSelPickerVal = colorSelPickerEle.value;
    console.log('colorSelPickerVal value change:', colorSelPickerVal);
    setRefColorsFromPickers();
    send('colorSelPickerValChg', {colorSelPickerVal});
  });

  setInterval(() => {
    const scrollContHeight = scrollContainerEle.getBoundingClientRect().height;
    if(scrollContHeight == lastScrollContHeight) return;
    lastScrollContHeight     = scrollContHeight;
    padBlockEle.style.height = `${scrollContHeight}px`;
    // console.log('scroll container height chg:', scrollContHeight);
  }, 50);

  send('ready', {});
});

function blkIdFromId(id) {return id.split('-').splice(0, 3).join('-')}
function tailFromId(id) {return id.split('-').splice(3).join('-')}

function setStyle(ele, prop, val) {
  if(ele) ele.style[prop] = val;
}

function collapse(blkId, collapseBtnEle) {
  // console.log('collapse', blkId);
  const preEle       = document.getElementById(`${blkId}-pre`);
  const expandBtnEle = collapseBtnEle.previousElementSibling;
  setStyle(preEle,         'display', 'none');
  setStyle(collapseBtnEle, 'display', 'none');
  setStyle(expandBtnEle,   'display', 'inline-block');
}

async function expand(blkId, expandBtnEle) {
  // console.log('expand', blkId);
  const preEle         = document.getElementById(`${blkId}-pre`);
  const collapseBtnEle = expandBtnEle.nextElementSibling;
  setStyle(preEle,         'display', 'block');
  setStyle(expandBtnEle,   'display', 'none');
  setStyle(collapseBtnEle, 'display', 'inline-block');
}

async function home() {
  // console.log('header home click');
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
  // console.log('header up  click');
  const topRes = getTopElement(scrollContainerEle, '.ds-block');
  if(!topRes) { console.error('up, no top element'); return; }
  // console.log('up topRes:', topRes);
  const {topEle, distTopToTop} = topRes;
  let eleToMoveToTop;
  const blockAtTop = distTopToTop < 3;
  if(blockAtTop) eleToMoveToTop = topEle.previousElementSibling;
  else           eleToMoveToTop = topEle;
  if(eleToMoveToTop) scrollBlockIntoView(eleToMoveToTop);
}

async function down() {
  // console.log('header down  click');
  const topRes = getTopElement(scrollContainerEle, '.ds-block');
  if(!topRes) { console.error('down, no top element'); return; }
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

async function sizeIt(size) {
  let fontSize = +htmlEle.style.fontSize.replace('px', '');
  fontSize *= size;
  const fontSizeStr = fontSize.toFixed(2) + 'px';
  htmlEle.style.fontSize = fontSizeStr;
  send('fontSizeChange',{fontSize:fontSizeStr});
} 

async function sizeAllUp()   { sizeIt(1.05); } 

async function sizeAllDown() { sizeIt(0.95); } 

function scrollBlockIntoView(ele) {
  if(!ele) { console.error('scrollBlockIntoView, ele not found'); return; }
  ele.scrollIntoView({
    behavior: 'auto', // 'smooth',
    block:    'start',     // Align the block with the top of the viewport
    inline:   'nearest'   // Keep horizontal alignment as is
  });
}

function scrollToBlkId(blockId) {
  let blkEle = document.getElementById(blockId);
  if(!blkEle) {
    console.error('scrollToBlockId, block not found:', blockId);
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
      console.error('scrollToFromRef, ref block missing:', refBlkId);
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
    case 'smallA':   sizeAllDown(); break;
    case 'largeA':   sizeAllUp();   break;
  }
}

function bannerButtonClick(ele, id, blockId, tail) {
  // console.log('bannerButtonClick:', {id, blockId, tail});
  switch(tail) {
    case 'icon-delete':   send('deleteButtonClick', {blockId}); break;
    case 'icon-collapse': collapse(blockId, ele);               break;
    case 'icon-expand':   expand(blockId, ele);                 break;
    case 'icon-refsup':   send('refsupClick', {blockId});       break;
    case 'icon-isolate':  send('isolateClick', {blockId});      break;
  }
}

function bannerNameClick(ele, bannerNameId) {
  // console.log('bannerNameClick:', bannerNameId, ele.innerText);
  const anc = findAncestorByClass(ele, 'ds-block');
  if(!anc) return;
  const {ele:blkEle} = anc;
  const fromRefId = blkEle.getAttribute('from-ref');
  if(!fromRefId) console.error(
          'bannerNameClick, no fromRefId:', bannerNameId);
  else scrollToFromRef(fromRefId);
}

function bannerPathClick(ele, bannerPathId) {
  const blockId = blkIdFromId(bannerPathId);
  // console.log('bannerPathClick:', bannerPathId);
  send('openEditor', {blockId});
}

function codeClick(blkEle) {
  const blockId = blkEle.id
  let lineNo  = +blkEle.querySelector('pre')
                        .getAttribute('data-start');
  lineNo -= 2;
  // console.log('codeClick:', {blockId, lineNo});
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
  // console.log('refClick:', refId, ele.innerText);
  setFromRefHighlight(ele);
  send('refClick', {refId});  
  setRefColorsFromPickers()
}

function findAncestorByClass(ele, klass) {
  if(!ele) return null;
  ele = ele.closest(`.${klass}`);
  if(!ele) {
    console.error('findAncestorByClass, class not found:', klass);
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
  // console.log('click event:', tagName, id);
  if (["path", "svg", "polygon", "polyline"].includes(tagName)) {
    const ancestor = findAncestorByClass(event.target, 'button');
    const {ele, id, blkId, tail} = ancestor;
    // console.log('button click:', {blkId, tail});
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

let bkgndAnimation = null;

function startBusyInd() {
  if(bkgndAnimation) return;
  const color = iframeHeaderEle.style.backgroundColor;
  bkgndAnimation = iframeHeaderEle.animate(
     [{ backgroundColor: "color" }, { backgroundColor: "yellow" }],
      { duration: 500, iterations: Infinity, direction: "alternate" });
  bkgndAnimation.finished.then(() => {
    iframeHeaderEle.style.backgroundColor = color;
    bkgndAnimation = null;
  });
}
function stopBusyInd() {
  if(bkgndAnimation) {
    bkgndAnimation.cancel();
    bkgndAnimation = null;
  }
}

async function insertBlock(blockHtml, toIndex) {
  const children = blocksContentEle.children;
  if(toIndex === undefined) toIndex = children.length-1;
  // console.log('insertBlock toIndex:', toIndex);
  if (toIndex < 0 || toIndex > children.length) {
    stopBusyInd(); // stop any busy indicator
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
  stopBusyInd();
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
  stopBusyInd();
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
      case 'stopBusyInd':   await stopBusyInd();                             break;
    }
  }
  requestAnimationFrame(cmdLoop);
}
requestAnimationFrame(cmdLoop);

// Listen for message from webview
window.addEventListener('message', event => {
  const message = event.data;
  // console.log('iframe, message from webview:', message);
  if(message.command == 'startBusyInd') startBusyInd(); 
  cmdQueue.push(message);
});

function send(command, data) {  
  // console.log('iframe sending to webview', {command, data});
  window.parent.postMessage({src:'iframe', command, data}, '*');
};
