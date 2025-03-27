const html  = require('./html.js');
const comm  = require('./comm.js');
const utils = require('./utils.js');
const log   = utils.getLog('NAVI');

let blk        = null;
let blockStack = [];

function init() {
  blk = require('./block.js');
  comm.registerWebviewRecv('refClick',          refClick);
  comm.registerWebviewRecv('deleteButtonClick', deleteButtonClick);
  comm.registerWebviewRecv('refsupClick',       refsupClick);
  comm.registerWebviewRecv('isolateClick',      isolateClick);
  blockStack = [];
}

async function isolateClick(data) {
  const blockIdToKeep = data.blockId;
  let blockToKeep = blockStack.find(b => b.id === blockIdToKeep);
  if(!blockToKeep) {
    log('err', 'isolateClick: block not found:', blockIdToKeep);
    return null;
  }
  for(const block of blockStack) {
    const blockId = block.id;
    if(blockId === blockIdToKeep) continue;
    await comm.send('deleteBlock', {blockId});
  }
  blockStack = [blockToKeep];
}

async function refsupClick(data) {
  const blockId   = data.blockId;
  const stackIdx  = blockStack.findIndex(b => b.id === blockId);
  if(stackIdx == -1) {
    log('err', 'refsupClick: block not found:', blockId);
    return null;
  }
  const block = blockStack[stackIdx];
  await blk.addRefBlocks(block, blockId);
}

async function deleteButtonClick(data) {
  const blockId = data.blockId;
  // log('deleteButtonClick:', blockId);
  const stackIdx = blockStack.findIndex(b => b.id === blockId);
  if(stackIdx == -1) return;
  const block = blockStack[stackIdx];
  blk.removeBlockFromCaches(block);
  blockStack.splice(stackIdx, 1);
  await comm.send('deleteBlock', {blockId});
}

async function refClick(data) {
  const fromRefId  = data.refId;
  const blocks     = blk.getBlocksByRefId(fromRefId);
  if(!blocks) {
    log('err', 'refClick: blocks not found, fromRefId:', fromRefId);
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
    await blk.addWordsAndDefs(defBlock);
    await addBlockToView(defBlock, fromRefId, refIndex);
  }
}

function getBlockById(blockId) {
  const blockIdx = blockStack.findIndex(b => b.id === blockId);
  if(blockIdx == -1) {
    log('err', 'getBlockById: block not found:', blockId);
    return null;
  }
  const block = blockStack[blockIdx];
  return { block, blockIdx };
}

async function addBlockToView(block, fromRefId = "root", toIndex) {
  // log('addBlockToView:', {block:block.id, toIndex});
  await blk.addWordsAndDefs(block);
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

module.exports = { init, getBlockById, addBlockToView };
