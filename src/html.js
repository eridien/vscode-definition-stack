const vscode   = require('vscode');
const path     = require('path');
const Prism    = require('prismjs');
const utils    = require('./utils.js');
const log      = utils.getLog('htmljs');
const template = require('../html/html-template.js').getHtml();

let context, webview;
let grammar, language;
let cssContent;
let fontFamily, fontWeight, fontSize;

async function init(contextIn, webviewIn, editorIn, languageIn = 'javascript') {
  context  = contextIn;
  webview  = webviewIn;
  grammar  = Prism.languages[languageIn];
  language = languageIn;
  const cssPath = path.join(context.extensionPath, 'themes', 'prism.css');
  const cssUri = vscode.Uri.file(cssPath);
  const cssBuffer = await vscode.workspace.fs.readFile(cssUri);
  cssContent = Buffer.from(cssBuffer).toString('utf8')
                     .replace(/\/\*[\s\S]*?\*\//g, '') // remove /* */
                     .replaceAll(/"/g, '&quot;');
  const config = vscode.workspace
                       .getConfiguration('editor', editorIn.document.uri);
  fontFamily   = config.fontFamily;
  fontWeight   = config.fontWeight;
  fontSize     = config.fontSize;
  log('html.js initialized');
}

let htmlBody = "";

function render() {
  const html = template
      .replace('**cssContent**', cssContent)
      .replace('<div></div>',    htmlBody)
      .replace('**fontFamily**', fontFamily)
      .replace('**fontSize**',   fontSize)
      .replace('**fontWeight**', fontWeight);
  webview.html = html;
}

function add(code) {
  const codeHtml = Prism.highlight(code, grammar, language);
  const wrappedHtml = `<pre><code>${codeHtml}</code></pre>`
                      .replaceAll(/"/g, '&quot;');
  htmlBody += wrappedHtml;
  render();
}

module.exports = { init, add, render };

