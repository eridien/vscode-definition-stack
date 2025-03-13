const vscode = require('vscode');
const comm   = require('./comm.js');
const utils  = require('./utils.js');
const log    = utils.getLog('HTML');

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
let templateHtml, lineNumCss, prePrismJs, prismCoreJs, lineNumJs, scriptJs;

async function loadConstFiles() {
  templateHtml = await utils.readTxt(context, false, 
                                                  'src', 'template.html');
  lineNumCss = await utils.readTxt(context, true, 
            'prism', 'plugins', 'line-numbers', 'prism-line-numbers.css');
  prePrismJs = `
    console.log('webview started');
    window.Prism = window.Prism || {};
		window.Prism.manual = true;
  `;
  prismCoreJs = await utils.readTxt(context, false, 
                                                'prism', 'prism-core.js');
  lineNumJs = await utils.readTxt(context, false, 
            'prism', 'plugins', 'line-numbers', 'prism-line-numbers.js');
  scriptJs = await utils.readTxt(context, false, 
                                                     'src', 'script.js');
}

async function init(contextIn, webviewIn) {
  context      = contextIn;
  webview      = webviewIn;
  webview.html = "";
  await loadConstFiles();
}

function setLanguage(editor) {
  const document  = editor.document;
  const vscLangId = document.languageId;
  language = vscLangIdToPrism[vscLangId];
  language ??= vscLangId;
}

async function addpre(code, lineNum, markup = false) {
  let preTag  ='';
  let klass   = "";
  let codeTag = code;
  let html;
  if(markup) {
    preTag  = `<pre `;
    if (lineNum != undefined) {
      klass  += " line-numbers";
      preTag += ` data-start="${lineNum}"`;
    }
    codeTag = `<code>${code}</code>`;
    if(klass) preTag += ` class="${klass}"`;
    html = `${preTag}>${codeTag}</pre>`;
  }
  else {
    html =`<span style="margin-top:5px; padding:2px 15px 5px 15px;
                    display:block;
                        margin-bottom:-10px; background-color:#ddd;">` +
                        `${code}</span>`;
  }
  await comm.send('addPre', {html, language});
}

async function setAllViewHtml(editor) {
  const document = editor.document;
  const prismCss = await utils.readTxt(context, true, 
                                          'prism', 'themes', 'prism.css');
                                          // 'prism', 'themes', 'prism-a11y-dark.css');
  const cssContent = prismCss + lineNumCss;

  const langClike = await utils.readTxt(context, false, 
                                  'prism', 'languages', 'prism-clike.js');
  const langJavascript = await utils.readTxt(context, false, 
                            'prism', 'languages', 'prism-javascript.js');
  const jsContent  = prePrismJs + prismCoreJs + 
                     langClike + langJavascript + 
                     lineNumJs + scriptJs;

  const config     = vscode.workspace.getConfiguration('editor', document.uri);
  const fontFamily = config.fontFamily;
  const fontWeight = config.fontWeight;
  const fontSize   = config.fontSize + 'px';

  const html = templateHtml
      .replace('**cssContent**', cssContent)
      .replace('**jsContent**',  jsContent)
      .replace('**fontFamily**', fontFamily)
      .replace('**fontSize**',   fontSize)
      .replace('**fontWeight**', fontWeight);
  webview.html = html;
}

function showMsgInPage(msg) {
  if(webview) {
    const msgHtml = 
      `<div style=" background: var(--vscode-editor-background);
                    color:      var(--vscode-editor-foreground);
                    border-radius: 8px;
                    padding: 10px;
                    margin:  10px;
                  "> ${msg} </div>`;
    webview.html = msgHtml;
  }
  else log('info', msg);
}

function highlightRefsWithIds(line) {
  let html = line.text;
  for(let idx = line.words.length-1; idx >= 0; idx--) {
    const word = line.words[idx];
    const endOfs = word.endWordOfs;
    html = html.slice(0, endOfs) + '</span>' + html.slice(endOfs);
    word.id = 'ref-' + utils.getUniqueId();
    const span = `<span id="${word.id}" class="ds-ref" style="background-color: #ff0;">`;
    const strtOfs = word.startWordOfs;
    html = html.slice(0, strtOfs) + span + html.slice(strtOfs);
  }
  line.html = html;
}

module.exports = {setLanguage, init, addpre, setAllViewHtml, 
                  showMsgInPage, highlightRefsWithIds};
