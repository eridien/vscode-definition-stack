// const utils  = require('./utils.js');
// const log = utils.getLog('htmljs');

const pug     = require('pug');
const htmlHdr = pug.render(require('../html/html-hdr.js').getPug());

let htmlBody = "";

function render(webview) {
  const html   = htmlHdr + htmlBody;
  webview.html = html;
}

function add(webview, html) {
  htmlBody += html;
  render(webview);
}

module.exports = { add, render };

