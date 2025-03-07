const vscode   = require('vscode');
const path     = require('path');
const Prism    = require('prismjs');
const pug      = require('pug');
const utils    = require('./utils.js');
const log      = utils.getLog('htmljs');
const template = pug.render(require('../html/html-hdr.js').getPug());

let context, webview;
let grammar, language
let cssUri, customCssUri, jsUri;

function init(contextIn, webviewIn, languageIn = 'javascript') {
  context  = contextIn;
  webview  = webviewIn;
  grammar  = Prism.languages[languageIn];
  language = languageIn;
  const cssPath = vscode.Uri.file(
      path.join(context.extensionPath, 'themes', 'prism.css'));
  cssUri = webview.asWebviewUri(cssPath);
  const customCssPath = vscode.Uri.file(
      path.join(context.extensionPath, 'themes', 'custom.css'));
  customCssUri = webview.asWebviewUri(customCssPath);
  const jsPath = vscode.Uri.file(
      path.join(context.extensionPath, 'themes', 'prism.js'));
  jsUri = webview.asWebviewUri(jsPath);

  log('html.js initialized');
}

let htmlBody = "";

function render() {
  const html = template
      .replace('**cssPath**', cssUri)
      .replace('**customCssPath**', customCssUri)
      .replace('**jsPath**',  jsUri)
      .replace('<div id="body"></div>', htmlBody);
  webview.html = html;
}

function add(code) {
  const codeHtml = Prism.highlight(code, grammar, language);
  const wrappedHtml = `<pre><code>${codeHtml}</code></pre>`;
  htmlBody += wrappedHtml;
  render();
}

module.exports = { init, add, render };

