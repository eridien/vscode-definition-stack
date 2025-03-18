// console.log('loading navigate module');

const html   = require('./html.js');
const comm  = require('./comm.js');
const utils = require('./utils.js');
const log   = utils.getLog('NAVI');

let blk = null;
let blockStack = [];

function init() {
  blk = require('./block.js');
  comm.registerWebviewRecv('refClick',    true, refClick);
  comm.registerWebviewRecv('buttonClick', true, buttonClick);
  blockStack = [];
}

async function closeBlock(stackIdx, blockId) {
  blockStack.splice(stackIdx, 1);
  await comm.send('removeBlock', {blockId});
}

async function buttonClick(data) {
  const blockId = utils.blkIdFromId(data.id);
  const name    = utils.nonBlkIdFromId(data.id);
  log('buttonClick:', {blockId, name});
  const stackIdx = blockStack.findIndex(b => b.id === blockId);
  if(stackIdx == -1) {
    log('err', 'buttonClick: block not found:', {blockId, blockStack});
    return;
  }
  switch(name) {
    case 'icon-close': await closeBlock(stackIdx, blockId); break;
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
  const refBlkId = utils.blkIdFromId(refId);
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
  log('addBlockToView:', {block:block.id, toIndex});
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
  else {
    const fromBlock = blockStack[fromIndex];
    blockStack.splice(fromIndex, 1);
    blockStack.splice(toIndex + (fromIndex < toIndex ? -1 : 0), 0, fromBlock);
    await comm.send('moveBlock', {fromIndex, toIndex});
  }
}

module.exports = { init, addBlockToView };
