const vscode   = require('vscode');
const utils    = require('./utils.js');
const log      = utils.getLog('htmljs');
const template = require('./html-template.js').getHtml();

let webview, language, header;
let fontFamily, fontWeight, fontSize;
let cssContent, jsContent;

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

async function init(context, webviewIn, editorIn) {
  htmlBody = "";
  const document  = editorIn.document;
  const vscLangId = document.languageId;
  language = vscLangIdToPrism[vscLangId];
  language ??= vscLangId;
  header = (language != vscLangId) ? 
              `Using language ${language}(prism), not ${vscLangId}(vscode)` : "";
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

function add(code, lineNum, markup = false) {
  let preTag  = `<pre `;
  let klass   = "";
  let codeTag = code;
  if(markup) {
    if (lineNum != undefined) {
      klass  += " line-numbers";
      preTag += ` data-start="${lineNum}"`;
    }
    if (language) klass += ` language-${language}`;
    codeTag = `<code>${code}</code>`;
  }
  else {
    preTag += ' style="margin-top:15px; margin-bottom:-5px; background-color:#ddd;"';
  }
  if(klass) preTag   += ` class="${klass}"`;
  const html = `${preTag}>${codeTag}</pre>`;
  console.log(html);
  htmlBody += html.replaceAll(/"/g, '&quot;');
}

function render() {
  const html = template
      .replace('**cssContent**', cssContent)
      .replace('**jsContent**',  jsContent)
      .replace('**body**',       htmlBody)
      .replace('**fontFamily**', fontFamily)
      .replace('**fontSize**',   fontSize)
      .replace('**fontWeight**', fontWeight);
  webview.html = html;
}

module.exports = { init, add, render };

