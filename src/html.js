const vscode   = require('vscode');
const path     = require('path');
const Prism    = require('prismjs');
const utils    = require('./utils.js');
const log      = utils.getLog('htmljs');
const template = require('../html/html-template.js').getHtml();

let context, webview;
let grammar, language
let cssUri,  jsUri;

function init(contextIn, webviewIn, languageIn = 'javascript') {
  context  = contextIn;
  webview  = webviewIn;
  grammar  = Prism.languages[languageIn];
  language = languageIn;
  const cssPath = vscode.Uri.file(
      path.join(context.extensionPath, 'themes', 'prism.css'));
  cssUri = webview.asWebviewUri(cssPath);
  const jsPath = vscode.Uri.file(
      path.join(context.extensionPath, 'themes', 'prism.js'));
  jsUri = webview.asWebviewUri(jsPath);
  log('html.js initialized');
}

let htmlBody = "";

function render() {
  const html = template
      .replace('**cssPath**', cssUri)
      // .replace('**jsPath**',  jsUri)
      .replace('<div></div>', htmlBody);
  webview.html = html;
}

function add(code) {
  const codeHtml = Prism.highlight(code, grammar, language);
  const wrappedHtml = `<pre><code>${codeHtml}</code></pre>`
    // .replaceAll(/</g, '&lt;')
    .replaceAll(/"/g, '&quot;');
  htmlBody += wrappedHtml;
  render();
}

module.exports = { init, add, render };

