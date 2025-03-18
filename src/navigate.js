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

async function buttonClick(data) {
  const idParts = data.id.split('-');
  const blkNo   = idParts[2];
  const name    = idParts.slice(4).join('-');
  log('buttonClick:', {blkNo, name});
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
