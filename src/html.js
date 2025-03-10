const vscode   = require('vscode');
const utils    = require('./utils.js');
const log      = utils.getLog('htmljs');
const template = require('./html-template.js').getHtml();

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

let context, webview, language;
let fontFamily, fontWeight, fontSize;
let cssContent, jsContent;

let htmlBody = "";

function clearPage() {
  htmlBody = "";
}

function setView(contextIn, webviewIn) {
  context = contextIn;
  webview = webviewIn;
  webview.html = "";
}

async function initPage(editor) {
  webview.html    = "";
  const document  = editor.document;
  const vscLangId = document.languageId;
  language = vscLangIdToPrism[vscLangId];
  language ??= vscLangId;
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

async function renderPage(editor) {
  await initPage(editor);
  const html = template
      .replace('**cssContent**', cssContent)
      .replace('**jsContent**',  jsContent)
      .replace('**body**',       htmlBody)
      .replace('**fontFamily**', fontFamily)
      .replace('**fontSize**',   fontSize)
      .replace('**fontWeight**', fontWeight);
  webview.html = html;
}

function showBusyAnimation() {
  const imagePath = vscode.Uri.joinPath(
                      context.extensionUri, 'images', 'loading.gif');
  const imageSrc = webview.asWebviewUri(imagePath);
  const busyHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <img src="${imageSrc}"/>
      </body>
    </html>
  `;
  webview.html = busyHtml;
}


module.exports = {setView, clearPage, add, renderPage, showBusyAnimation};

