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

async function addBlockToView(block) {
  const {id, name, relPath, lines} = block;
  log('adding block to view', name.padEnd(15), relPath);
  let minWsIdx = Number.MAX_VALUE;
  for(const line of lines) {
    const wsIdx = line.firstNonWhitespaceCharacterIndex;
    minWsIdx = Math.min(minWsIdx, wsIdx);
  }
  let code = "";
  for(const line of lines)
    code += ((line.html.slice(minWsIdx)) + "\n");
  const blockHtml = 
   `<div id="${id}" class="ds-block">
      <span style="margin-top:5px; padding:2px 15px 5px 15px;
                    display:block; margin-bottom:-10px; 
                    background-color:#ddd;">
        <span style="color:#444;">
          <span style="color:#f44;">${name}</span> in 
          <span style="color:#f44;">${relPath}</span>
        </span>
      </span>
      <pre data-start="${lines[0].lineNumber+1}" class="language-${language}">` +
        `<code class="language-${language}">${code}</code>`                     +
     `</pre>
    </div>`;
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

module.exports = {setLanguage, init, initWebviewHtml, addBlockToView, 
                  showMsgInPage, markupRefs};
