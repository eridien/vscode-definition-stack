// const utils  = require('./utils.js');
// const log = utils.getLog('htmljs');

const pug      = require('pug');
const template = pug.render(require('../html/html-hdr.js').getPug());

let htmlBody = "";

function render(webview) {
  const html   = template.replace('<div id="body"></div>', htmlBody);
  webview.html = html;
}

function add(webview, html) {
  htmlBody += html;
  render(webview);
}

module.exports = { add, render };

