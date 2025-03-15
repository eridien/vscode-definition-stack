const blk   = require('./block.js');
const comm  = require('./comm.js');
const utils = require('./utils.js');
const log   = utils.getLog('NAVI');

function init() {
  comm.registerWebviewRecv('refClick', true, refClick);
}

function refClick(data) {
  const refId = data.id;
  const blocks = blk.getBlocksByRefId(refId);
  if(!blocks) {
    log('refClick: blocks not found, refId:', refId);
    blk.showAllBlocks();
    return;
  }
  let blocksStr = '';
  for(const block of blocks)
    blocksStr += `${block.id }:${block.name}, `;
  log('click:', refId, blocksStr.slice(0, -2));
  // blk.showAllBlocks();
  // blk.showAllRefs();
}

module.exports = { init };
