// console.log('loading html module');

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
let templateHtml, templateJs, iframeHtmlIn, iframeJsIn;
let lineNumCss, prePrismJs, prismCoreJs, lineNumJs, keepMarkupJs;

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

function getIconHtml(name) {
  return '<svg width="16" height="16" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M464 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm0 394c0 3.3-2.7 6-6 6H54c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h404c3.3 0 6 2.7 6 6v340zM356.5 194.6L295.1 256l61.4 61.4c4.6 4.6 4.6 12.1 0 16.8l-22.3 22.3c-4.6 4.6-12.1 4.6-16.8 0L256 295.1l-61.4 61.4c-4.6 4.6-12.1 4.6-16.8 0l-22.3-22.3c-4.6-4.6-4.6-12.1 0-16.8l61.4-61.4-61.4-61.4c-4.6-4.6-4.6-12.1 0-16.8l22.3-22.3c4.6-4.6 12.1-4.6 16.8 0l61.4 61.4 61.4-61.4c4.6-4.6 12.1-4.6 16.8 0l22.3 22.3c4.7 4.6 4.7 12.1 0 16.8z"/></svg>';
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

function bannerHtml(name, relPath) {
  return `<span style="margin-top:5px; padding:2px 15px 5px 15px;
                       display:block; margin-bottom:-10px; 
                       background-color:#ddd;">
            <span style="color:#444;">` +
                getIconHtml('close-window') +
             `<span style="color:#f44;">${name}</span> in 
              <span style="color:#f44;">${relPath}</span>
            </span>
          </span>`;
}

function codeHtml(lines, code) {
  return `<pre data-start="${lines[0].lineNumber+1}" 
               class="line-numbers language-${language}">`     +
           `<code class="language-${language}">${code}</code>` +
         `</pre>`
}

async function addEmptyBlockToView(id, name, relPath) {
  log('adding empty block to view:', name.padEnd(15), relPath);
  const blockHtml = 
   `<div id="${id}" class="ds-block">`                               +
      bannerHtml(name, relPath)                                      +
     `<pre class="language-${language}">`                            +
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
   `<div id="${id}" class="ds-block">` +
      bannerHtml(name, relPath)        +
      codeHtml(lines, code)            +
   `</div>`;
  await comm.send('addBlock', {blockHtml});
}

async function initWebviewHtml(editor) {
  const document = editor.document;
  const prismCss = await utils.readTxt(context, true, 
                                          'prism', 'themes', 'prism.css');
                                          // 'prism', 'themes', 'prism-a11y-dark.css');
  const iframeCss = prismCss + lineNumCss;

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
      `<div style=" background: var(--vscode-editor-background);
                    color:      var(--vscode-editor-foreground);
                    font-size:17px; font-weight:bold;
                  "> ${msg} </div>`;
    webview.html = msgHtml;
  }
  else log('info', msg);
}

function markupRefs(line, style) {
  let html = line.text;
  for(let idx = line.words.length-1; idx >= 0; idx--) {
    const word = line.words[idx];
    const endOfs = word.endWordOfs;
    html = html.slice(0, endOfs) + '</span>' + html.slice(endOfs);
    const span = `<span id="${word.id}" class="ds-ref" onclick="refClick" style="${style}">`;
    const strtOfs = word.startWordOfs;
    html = html.slice(0, strtOfs) + span + html.slice(strtOfs);
  }
  line.html = html;
}

module.exports = {setLanguage, init, initWebviewHtml, 
                  addEmptyBlockToView, addBlockToView, 
                  showInWebview, markupRefs};
