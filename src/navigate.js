// console.log('loading navigate module');

const html   = require('./html.js');
const comm  = require('./comm.js');
const utils = require('./utils.js');
const log   = utils.getLog('NAVI');

let blk = null;

function init() {
  blk = require('./block.js');
  comm.registerWebviewRecv('refClick',    true, refClick);
  comm.registerWebviewRecv('buttonClick', true, buttonClick);
}

const blockStack = [];

async function closeBlock(stackIdx, blockId) {
  blockStack.splice(stackIdx, 1);
  await comm.send('removeBlock', {blockId});
}

async function collapeBlock(stackIdx) {
}
async function expandBlock(stackIdx){
}
async function upBlock(stackIdx) {
}
async function downBlock(stackIdx) {
}
async function home(stackIdx) {
}

async function buttonClick(data) {
  const idParts = data.id.split('-');
  const blockId = idParts.slice(0, -2).join('-');
  const name    = idParts.slice(4)    .join('-');
  log('buttonClick:', {blockId, name});
  const stackIdx = blockStack.findIndex(b => b.id === blockId);
  if(stackIdx == -1) {
    log('err', 'buttonClick: block not found:', {blockId, blockStack});
    return;
  }
  switch(name) {
    case 'close':         await closeBlock(stackIdx, blockId); break;
    case 'collapse-vert': await collapeBlock(stackIdx); break;
    case 'expand-vert':   await expandBlock(stackIdx); break;
    case 'up-ptr':        await upBlock(stackIdx); break;
    case 'down-ptr':      await downBlock(stackIdx); break;
    case 'home':          await home(stackIdx); break;
  }
}

async function refClick(data) {
  const refId  = data.id;
  const blocks = blk.getBlocksByRefId(refId);
  if(!blocks) {
    log('err', 'refClick: blocks not found, refId:', refId);
    blk.showAllBlocks();
    blk.showAllRefs();
    return;
  }
  const refBlkId = refId.split('-').splice(0, 3).join('-');
  let refIndex   = blockStack.findIndex(b => b.id === refBlkId);
  if(refIndex == -1) {
    log('err', 'refClick: ref block not in blockStack', refBlkId, blockStack);
    return;
  }
  for(const defBlock of blocks) {
    await blk.addAllData(defBlock);
    await addBlockToView(defBlock, refIndex);
  }
}

async function addBlockToView(block, toIndex) {
  log('addBlockToView:', {block, toIndex});
  const fromIndex = blockStack.findIndex(b => b.id === block.id);
  if(fromIndex == -1) {
    if(toIndex === undefined || toIndex >= blockStack.length) {
      blockStack.push(block);
      await html.addBlockToView(block);
      return;
    }
    else blockStack.splice(toIndex, 0, block);
    await html.addBlockToView(block, toIndex);
  }
  else await comm.send('moveBlock', {fromIndex, toIndex});
}

module.exports = { init, addBlockToView };
