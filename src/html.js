const vscode   = require('vscode');
const path     = require('path');
const Prism    = require('prismjs');
const utils    = require('./utils.js');
const log      = utils.getLog('htmljs');
const template = require('../html/html-template.js').getHtml();

let context,    webview;
let grammar,    language;
let cssContent, header;
let fontFamily, fontWeight, fontSize;

const vscLangIdToPrism = {
  "bat":"batch",
  "dockerfile":"docker",
  "jsx-tags":"jsx",
  "objective-c":"objectivec",
  "objective-cpp":"objectivec",
  "jade":"pug",
  "shellscript:":"bash",
  "vue":"javascript"
}

async function init(contextIn, webviewIn, editorIn) {
  const document  = editorIn.document;
  const vscLangId = document.languageId;
  language = vscLangIdToPrism[vscLangId];
  language ??= vscLangId;
  header = (language != vscLangId) ? 
              `Using ${language} (prism) not ${vscLangId} (vscode)` : "";
  context  = contextIn;
  webview  = webviewIn;
  grammar  = Prism.languages[language];
  const cssPath = path.join(context.extensionPath, 'themes', 'prism.css');
  const cssUri = vscode.Uri.file(cssPath);
  const cssBuffer = await vscode.workspace.fs.readFile(cssUri);
  cssContent = Buffer.from(cssBuffer).toString('utf8')
                     .replace(/\/\*[\s\S]*?\*\//g, '') // remove /* */
                     .replaceAll(/"/g, '&quot;');
  const config = vscode.workspace.getConfiguration('editor', document.uri);
  fontFamily = config.fontFamily;
  fontWeight = config.fontWeight;
  fontSize   = config.fontSize;
  log('html.js initialized');
}

let htmlBody = "";

function render() {
  const html = template
      .replace('**cssContent**', cssContent)
      .replace('**body**',       header+htmlBody)
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

