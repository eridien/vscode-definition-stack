const utils  = require('./utils.js');
const log = utils.getLog('htmljs');

const pug   = require('pug');
const html1 = pug.render(require('../html/1-html.pug'));
let   html2 = "";
const html3 = pug.render(require('../html/3-.html.pug'));

async function getHtml() {
  const html = html1 + html2 + html3;
  log({html});
  return html;
}

module.exports = { getHtml };
