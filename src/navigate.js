// console.log('loading navigate module');

const html   = require('./html.js');
const comm   = require('./comm.js');
const utils  = require('./utils.js');
const log    = utils.getLog('NAVI');

let blk           = null;
let blockStack    = [];

function init() {
  blk = require('./block.js');
  comm.registerWebviewRecv('refClick', refClick);
  comm.registerWebviewRecv('closeButtonClick', closeButtonClick);
  blockStack = [];
}

async function closeBlock(stackIdx, blockId) {
  blockStack.splice(stackIdx, 1);
  await comm.send('removeBlock', {blockId});
}

async function closeButtonClick(data) {
  const blkId = data.blkId;
  log('closeButtonClick:', blkId);
  const stackIdx = blockStack.findIndex(b => b.id === blkId);
  if(stackIdx == -1) {
    log('err', 'closeButtonClick: block not found:', blkId);
    return;
  }
  await closeBlock(stackIdx, blkId);
}

async function refClick(data) {
  const fromRefId  = data.refId;
  const blocks     = blk.getBlocksByRefId(fromRefId);
  if(!blocks) {
    log('err', 'refClick: blocks not found, fromRefId:', fromRefId);
    blk.showAllBlocks();
    blk.showAllRefs();
    return;
  }
  const refBlkId = utils.blkIdFromId(fromRefId);
  let refIndex   = blockStack.findIndex(b => b.id === refBlkId);
  if(refIndex == -1) {
    log('err', 'refClick: ref block not in blockStack', refBlkId, blockStack);
    return;
  }
  for(const defBlock of blocks) {
    defBlock.fromRefId = fromRefId;
    await blk.addAllData(defBlock);
    await addBlockToView(defBlock, fromRefId, refIndex);
  }
}

async function addBlockToView(block, fromRefId = "root", toIndex) {
  log('addBlockToView:', {block:block.id, toIndex});
  const fromIndex = blockStack.findIndex(b => b.id === block.id);
  if(fromIndex == -1) {
    if(toIndex === undefined || toIndex >= blockStack.length) {
      blockStack.push(block);
      await html.addBlockToView(block, fromRefId);
      return;
    }
    else blockStack.splice(toIndex, 0, block);
    await html.addBlockToView(block, fromRefId, toIndex);
  }
  else {
    const fromBlock = blockStack[fromIndex];
    blockStack.splice(fromIndex, 1);
    blockStack.splice(toIndex + (fromIndex < toIndex ? -1 : 0), 0, fromBlock);
    await comm.send('moveBlock', {fromIndex, toIndex, fromRefId});
  }
}

module.exports = { init, addBlockToView };
