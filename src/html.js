const vscode   = require('vscode');
const path     = require('path');
const Prism    = require('prismjs');
const utils    = require('./utils.js');
const log      = utils.getLog('htmljs');
const template = require('./html-template.js').getHtml();

let context, webview;
let language;
let cssContent, jsContent;
let fontFamily, fontWeight, fontSize;
let header;

const vscLangIdToPrism = {
  "bat":           "batch",
  "dockerfile":    "docker",
  "jsx-tags":      "jsx",
  "objective-c":   "objectivec",
  "objective-cpp": "objectivec",
  "jade":          "pug",
  "shellscript:":  "bash",
  "vue":           "javascript"
}

let htmlBody = "";

async function init(contextIn, webviewIn, editorIn) {
  htmlBody = "";
  const document  = editorIn.document;
  const vscLangId = document.languageId;
  language = vscLangIdToPrism[vscLangId];
  language ??= vscLangId;
  header = (language != vscLangId) ? 
              `Using ${language}(prism) not ${vscLangId}(vscode)` : "";
  context  = contextIn;
  webview  = webviewIn;
  const config = vscode.workspace.getConfiguration('editor', document.uri);
  fontFamily   = config.fontFamily;
  fontWeight   = config.fontWeight;
  fontSize     = config.fontSize + 'px';
  const prismCss   = await utils.readTxt(context, true, 
                                          'prism', 'themes', 'prism.css');
  const lineNumCss = await utils.readTxt(context, true, 
            'prism', 'plugins', 'line-numbers', 'prism-line-numbers.css');
  cssContent = prismCss + lineNumCss;

  const prismCoreJs = await utils.readTxt(context, false, 
                                                'prism', 'prism-core.js');
  const langClike = await utils.readTxt(context, false, 
                                  'prism', 'languages', 'prism-clike.js');
  const langJavascript = await utils.readTxt(context, false, 
                             'prism', 'languages', 'prism-javascript.js');
  const lineNumJs = await utils.readTxt(context, false, 
             'prism', 'plugins', 'line-numbers', 'prism-line-numbers.js');
  jsContent = prismCoreJs + langClike + langJavascript + lineNumJs;

  log('html.js initialized');
}

function add(code) {
  const wrappedHtml = 
          `<pre><code class="language-javascript">${code}</code></pre>`
          .replaceAll(/"/g, '&quot;');
  htmlBody += wrappedHtml;
}

function render() {
  const html = template
      .replace('**cssContent**', cssContent)
      .replace('**jsContent**',  jsContent)
      .replace('**body**',       header+htmlBody)
      .replace('**fontFamily**', fontFamily)
      .replace('**fontSize**',   fontSize)
      .replace('**fontWeight**', fontWeight);
  webview.html = html;
}

module.exports = { init, add, render };

