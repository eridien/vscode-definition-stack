// console.log('loading html module');

const vscode = require('vscode');
const comm   = require('./comm.js');
const svg    = require('./svg.js');
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
let templateHtml, templateJs, iframeHtmlIn, iframeJsIn;
let iframeCssIn, lineNumCss, dsCss, prePrismJs, prismCoreJs, lineNumJs, keepMarkupJs;

async function loadConstFiles() {
  templateHtml = await utils.readTxt(context, false, 
                                                  'www', 'template.html');
  templateJs = await utils.readTxt(context, false, 
                                                    'www', 'template.js');
  iframeHtmlIn = await utils.readTxt(context, false, 
                                                    'www', 'iframe.html'); 
  iframeJsIn = await utils.readTxt(context, false, 
                                                      'www', 'iframe.js'); 
  lineNumCss = await utils.readTxt(context, true, 
            'prism', 'plugins', 'line-numbers', 'prism-line-numbers.css');
            
  iframeCssIn = await utils.readTxt(context, true, 
                                                    'www', 'iframe.css'); 
  prePrismJs = `
    console.log('webview started');
    window.Prism = window.Prism || {};
		window.Prism.manual = true;
  `;
  prismCoreJs = await utils.readTxt(context, false, 
                                                'prism', 'prism-core.js');
  keepMarkupJs = await utils.readTxt(context, false, 
               'prism', 'plugins', 'keep-markup', 'prism-keep-markup.js');
  lineNumJs = await utils.readTxt(context, false, 
             'prism', 'plugins', 'line-numbers', 'prism-line-numbers.js');
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

function bannerHtml(name, relPath, symbol) {
  const symbolType = symbolTypeByKind(symbol?.kind);
  return `<span class="banner">
            <div>` +
              svg.iconHtml('close') +
              // svg.iconHtml('expand-vert') +
              svg.iconHtml('collapse-vert') +
              svg.iconHtml('caret-up') +
              svg.iconHtml('caret-down') +
              svg.iconHtml('home3') + 
           `</div>
              <div class="banner-text"> 
              <span class="banner-type">${symbolType}</span> 
              <span class="hover banner-name">${name}</span> in 
              <span class="hover banner-path">${relPath}</span>
            </div>
          </span>`;
}

function codeHtml(lines, code) {
  return `<pre data-start="${lines[0].lineNumber+1}" 
               class="line-numbers">`     +
           `<code class="language-${language}">${code}</code>` +
         `</pre>`;
}

async function addEmptyBlockToView(id, name, relPath) {
  log('adding empty block to view:', name.padEnd(15), relPath);
  const blockHtml = 
   `<div id="${id}" class="ds-block">`                               +
      bannerHtml(name, relPath)                                      +
     `<pre>`                                                         +
       `<code class="language-${language}">`                         +
         `Definition is an entire file and is hidden. See settings.` +
       `</code>`                                                     +
     `</pre>
    </div>`;
  await comm.send('addBlock', {blockHtml});
}

async function addBlockToView(block) {
  const {id, name, relPath, lines} = block;
  if(block.flags.isEntireFile) {
    addEmptyBlockToView(id, name, relPath)
    return;
  }
  log('adding block to view:', name.padEnd(15), relPath);
  let minWsIdx = Number.MAX_VALUE;
  for(const line of lines) {
    const wsIdx = line.firstNonWhitespaceCharacterIndex;
    minWsIdx = Math.min(minWsIdx, wsIdx);
  }
  let code = "";
  for(const line of lines)
    code += ((line.html.slice(minWsIdx)) + "\n");
  const blockHtml = 
   `<div id="${id}" class="ds-block">`           +
      bannerHtml(name, relPath, block.srcSymbol) +
      codeHtml(lines, code)                      +
   `</div>`;
  await comm.send('addBlock', {blockHtml});
}

async function initWebviewHtml(editor) {
  const document = editor.document;
  const prismCss = await utils.readTxt(context, true, 
                                          'prism', 'themes', 'prism.css');
                                          // 'prism', 'themes', 'prism-a11y-dark.css');
  const iframeCss = prismCss + lineNumCss + dsCss + iframeCssIn;

  const langClike = await utils.readTxt(context, false, 
                                  'prism', 'languages', 'prism-clike.js');
  const langJavascript = await utils.readTxt(context, false, 
                            'prism', 'languages', 'prism-javascript.js');
  const iframeJs = (prePrismJs + prismCoreJs + 
                    langClike + langJavascript + 
                    keepMarkupJs + lineNumJs + iframeJsIn); 

  const config     = vscode.workspace.getConfiguration('editor', document.uri);
  const fontFamily = ` */ font-family: ${config.fontFamily}; /* `;
  const fontWeight = ` */ font-weight: ${config.fontWeight}; /* `;
  const fontSize   = ` */ font-size:   ${config.fontSize}px;   /* `;

  const iframeHtml = (iframeHtmlIn
      .replace('**iframeCss**',  ` */ ${iframeCss} /*`)
      .replace('**iframeJs**',   iframeJs)
      .replace('**fontFamily**', fontFamily)
      .replace('**fontSize**',   fontSize)
      .replace('**fontWeight**', fontWeight))
      .replaceAll(/"/g, '&quot;');

  const html = templateHtml
      .replace('**templateJs**', templateJs)
      .replace('**iframeHtml**', iframeHtml);
      
  webview.html = html;
}

function showInWebview(msg) {
  if(webview) {
    const msgHtml = 
      `<div class="msgHtml"> ${msg} </div>`;
    webview.html = msgHtml;
  }
  else log('info', msg);
}

function showMsgInPage(msg) {
  if(webview) {
    const msgHtml = `<div class="msgHtml"> ${msg} </div>`;
    webview.html = msgHtml;
  }
  else log('info', msg);
}

function markupRefs(line) {
  let html = line.text;
  for(let idx = line.words.length-1; idx >= 0; idx--) {
    const word = line.words[idx];
    const endOfs = word.endWordOfs;
    html = html.slice(0, endOfs) + '</span>' + html.slice(endOfs);
    const span = `<span id="${word.id}" onclick="refClick"
                        class="ds-ref hover ref-span">`;
    const strtOfs = word.startWordOfs;
    html = html.slice(0, strtOfs) + span + html.slice(strtOfs);
  }
  line.html = html;
}

function symbolTypeByKind(kind) {
  return {
    1: "File", 2: "Module", 3: "Namespace", 4: "Package", 5: "Class", 6: "Method", 7: "Property",
    8: "Field", 9: "Constructor", 10: "Enum", 11: "Interface", 12: "Function", 13: "Variable",
    14: "Constant", 15: "String", 16: "Number", 17: "Boolean", 18: "Array", 19: "Object", 20: "Key",
    21: "Null", 22: "EnumMember", 23: "Struct", 24: "Event", 25: "Operator", 26: "TypeParameter" }
  [kind+1] ?? ""};

module.exports = {setLanguage, init, initWebviewHtml, 
                  addEmptyBlockToView, addBlockToView, 
                  showInWebview, showMsgInPage, markupRefs};
