const blk   = require('./block.js');
const html   = require('./html.js');
const comm  = require('./comm.js');
const utils = require('./utils.js');
const log   = utils.getLog('NAVI');

function init() {
  comm.registerWebviewRecv('refClick', true, refClick);
}

async function refClick(data) {
  const refId = data.id;
  const blocks = blk.getBlocksByRefId(refId);
  if(!blocks) {
    log('refClick: blocks not found, refId:', refId);
    blk.showAllBlocks();
    return;
  }
  let blocksStr = '';
  for(const block of blocks) {
    await blk.addPossibleWords(block);
    await blk.addDefBlocks(block);
    html.addBlockToView(block);
    blocksStr += `${block.id }:${block.name}, `;
  }
  log('click:', refId, blocksStr.slice(0, -2));
}

module.exports = { init };
