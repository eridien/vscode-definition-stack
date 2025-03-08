const vscode   = require('vscode');
const path     = require('path');
const Prism    = require('prismjs');
const utils    = require('./utils.js');
const log      = utils.getLog('htmljs');
const template = require('./html-template.js').getHtml();

let context,    webview;
let grammar,    language;
let cssContent, jsContent;
let fontFamily, fontWeight, fontSize;
let header;

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
  grammar  = Prism.languages[language];
  const prismCssPath = path.join(context.extensionPath, 
                            'prism', 'themes', 'prism.css');
  const prismCssUri = vscode.Uri.file(prismCssPath);
  const prismCssBuffer = await vscode.workspace.fs.readFile(prismCssUri);
  const prismCss = Buffer.from(prismCssBuffer).toString('utf8')
                         .replace(/\/\*[\s\S]*?\*\//g, '') // remove /* */
                         .replaceAll(/"/g, '&quot;');

  const lineNumCssPath = path.join(context.extensionPath,      
                              'prism', 'plugins', 'line-numbers', 
                              'prism-line-numbers.css');
  const lineNumCssUri = vscode.Uri.file(lineNumCssPath);
  const lineNumCssBuf = await vscode.workspace.fs.readFile(lineNumCssUri);
  const lineNumCss    = Buffer.from(lineNumCssBuf).toString('utf8')
                              .replace(/\/\*[\s\S]*?\*\//g, '') // remove /* */
                              .replaceAll(/"/g, '&quot;');
  cssContent = prismCss + lineNumCss;

  const lineNumJsPath = path.join(context.extensionPath,      
                             'prism', 'plugins', 'line-numbers', 
                             'prism-line-numbers.js');

  const prismCoreJsPath = path.join(context.extensionPath,      
                               'prism', 'prism-core.js');
  const prismCoreJsUri = vscode.Uri.file(prismCoreJsPath);
  const prismCoreJsBuf = await vscode.workspace.fs.readFile(prismCoreJsUri);
  const prismCoreJs = Buffer.from(prismCoreJsBuf).toString('utf8')
                            .replace(/\/\*[\s\S]*?\*\//g, '') // remove /* */
                            .replaceAll(/"/g, '&quot;');

  const lineNumJsUri = vscode.Uri.file(lineNumJsPath);
  const lineNumJsBuf = await vscode.workspace.fs.readFile(lineNumJsUri);
  const lineNumJs = Buffer.from(lineNumJsBuf).toString('utf8')
                     .replace(/\/\*[\s\S]*?\*\//g, '') // remove /* */
                    .replaceAll(/"/g, '&quot;');
  jsContent = prismCoreJs + lineNumJs;

  const config = vscode.workspace.getConfiguration('editor', document.uri);
  fontFamily   = config.fontFamily;
  fontWeight   = config.fontWeight;
  fontSize     = config.fontSize;
  log('html.js initialized');
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

function add(code) {
  const codeHtml = Prism.highlight(code, grammar, language);
  const wrappedHtml = `<pre><code>${codeHtml}</code></pre>`
                      .replaceAll(/"/g, '&quot;');
  htmlBody += wrappedHtml;
  render();
}

module.exports = { init, add, render };

