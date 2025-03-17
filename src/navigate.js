// console.log('loading navigate module');

const html   = require('./html.js');
const comm  = require('./comm.js');
const utils = require('./utils.js');
const log   = utils.getLog('NAVI');

let blk = null;

function init() {
  blk = require('./block.js');
  comm.registerWebviewRecv('refClick', true, refClick);
}

const blockStack = [];

async function refClick(data) {
  const refId  = data.id;
  const blocks = blk.getBlocksByRefId(refId);
  if(!blocks) {
    log('err', 'refClick: blocks not found, refId:', refId);
    blk.showAllBlocks();
    blk.showAllRefs();
    return;
  }
  for(const block of blocks) {
    await blk.addAllData(block);
    await addBlockToView(block);
  }
}

/*
  insertBlock(blockHtml, index);
  moveBlock(fromIdx, toIndex);  
  removeBlock(blockId);              
*/

async function addBlockToView(block) {
  if(blockStack.includes(block)) return;
  log('addBlockToView:', block.id, block.name)
  blockStack.push(block);
  await html.addBlockToView(block);
}

module.exports = { init, addBlockToView };
