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

let webview, context, language, theme;
let webviewHtml, webviewJs, iframeHtmlIn, iframeJsIn;
let iframeCssIn, lineNumCss, prePrismJs, prismCoreJs;
let lineNumJs, keepMarkupJs, keepEscJs;

async function loadConstFiles() {
  webviewHtml = await utils.readTxt( false, 'www', 'webview.html');
  webviewJs = await utils.readTxt(   false, 'www', 'webview.js');
  iframeHtmlIn = await utils.readTxt(false, 'www', 'iframe.html'); 
  iframeJsIn = await utils.readTxt(  false, 'www', 'iframe.js'); 
  lineNumCss = await utils.readTxt(  true,  'prism', 'plugins', 
                      'line-numbers', 'prism-line-numbers.css');
  iframeCssIn = await utils.readTxt( true,  'www', 'iframe.css'); 
  prePrismJs = `
    console.log('webview started');
    debugger;
    window.Prism = window.Prism || {};
		window.Prism.manual = true;
  `;
  prismCoreJs = await utils.readTxt(false, 
                                                'prism', 'prism-core.js');
  keepMarkupJs = await utils.readTxt(false, 
               'prism', 'plugins', 'keep-markup', 'prism-keep-markup.js');
  lineNumJs = await utils.readTxt(false, 
             'prism', 'plugins', 'line-numbers', 'prism-line-numbers.js');
  keepEscJs = await utils.readTxt(false, 
                                       'prism', 'plugins', 'keep-esc.js');
}

async function init(contextIn, webviewIn) {
  context = contextIn;
  webview = webviewIn;
  webview.html = "";
  await loadConstFiles();
}

function setTheme() {
  theme = context.globalState.get('theme', 'dark');
  log('setTheme:', theme);
}

function setLanguage(editor) {
  const document = editor.document;
  const path = document.uri.fsPath;
  language = context.globalState.get(`lang-for-path-${path}`, 'notset');
  if(language == 'notset') {
    const vscLangId = document.languageId;
    language = vscLangIdToPrism[vscLangId];
    language ??= vscLangId;
  }
  log('set language:', language);
}

async function langSelectHtml() {
  let options = `<select id="lang-select-hdr" readonly="true">\n
                   <option value="unknown">Unknown</option>\n`;
  const files = await utils.readDirByRelPath('prism', 'languages');
  for(const file of files) {
    const matches = /^prism-(.*)\.min\.js$/.exec(file);
    if(!matches) continue;
    const lang = matches[1];
    options += `<option value="${lang}">${lang}</option>\n`;
  }
  return options + `</select>`  ;
}

// context.globalState.update('theme', theme);

async function themeSelectHtml() {
  let options = `<select id="theme-select-hdr" readonly="true">`;
  const files = await utils.readDirByRelPath('prism', 'themes');
  for(const file of files) {
    const matches = /^prism-(.*)\.css$/.exec(file);
    if(!matches) continue;
    const theme = matches[1];
    options += `<option value="${theme}">${theme}</option>\n`;
  }
  return options + `</select>`  ;
}

async function hdrHtml() {
  return `<div id="iframe-header">` +
            svg.iconHtml('home',     "iframe-hdr") + 
            svg.iconHtml('up-ptr',   "iframe-hdr") +
            svg.iconHtml('down-ptr', "iframe-hdr") +
            svg.iconHtml('collapse', "iframe-hdr") +
            svg.iconHtml('expand',   "iframe-hdr") +
            (await themeSelectHtml()) + ' ' +
            (await langSelectHtml())               +
         `</div>`;
}

function bannerHtml(name, path, blkId, symbol) {
  const symbolTypeNum = symbol?.kind;
  const symbolType    = symbolTypeByKind(symbolTypeNum);
  return `<span class="banner">
            <div>` +
              svg.iconHtml('close',    blkId) +
              svg.iconHtml('expand',   blkId, 'display:none') +
              svg.iconHtml('collapse', blkId) +
           `</div>
            <div class="banner-text"> 
              <span class="banner-type">${symbolType}</span> 
              <span id="${blkId}-banner-name" 
                    class="hover banner-name">${name}</span> in 
              <span id=${blkId}-banner-path" 
                    class="hover banner-path">${path}</span>
            </div>
          </span>`;
}

// style doesn't work in css file(?), even with !important
function codeHtml(lines, code, blkId) {
  return `<pre id="${blkId}-pre"
               style="white-space: pre-wrap; 
                      word-wrap: break-word; 
                      overflow-wrap: break-word;" 
                      data-start="${lines[0].lineNumber+1}" 
               class="line-numbers">`     +
           `<code class="language-${language}">${code}</code>` +
         `</pre>`;
}

async function addEmptyBlockToView(id, name, relPath, toIndex, fromRef) {
  // log('adding empty block to view:', name, relPath);
  const blockHtml = 
   `<div id="${id}" class="ds-block" from-ref="${fromRef}">`          +
      bannerHtml(name, relPath, id)                                  +
     `<pre>`                                                         +
       `<code class="language-${language}">`                         +
         `Definition is an entire file and is hidden. See settings.` +
       `</code>`                                                     +
     `</pre>
    </div>`;
  await comm.send('insertBlock', {blockHtml, toIndex});
}

async function addBlockToView(block, fromRef, toIndex) {
  const {id, name, relPath, lines} = block;
  if(block.flags.isEntireFile) {
    addEmptyBlockToView(id, name, relPath, toIndex, fromRef)
    return;
  }
  log('adding block to view:', {name, relPath, toIndex});
  let minWsIdx = Number.MAX_VALUE;
  for(const line of lines) {
    const wsIdx = line.firstNonWhitespaceCharacterIndex;
    minWsIdx = Math.min(minWsIdx, wsIdx);
  }
  let code = "";
  for(const line of lines)
    code += ((line.html.slice(minWsIdx)) + "\n");
  const blockHtml = 
   `<div id="${id}" class="ds-block" from-ref="${fromRef}">` +
      bannerHtml(name, relPath, id, block.srcSymbol)         +
      codeHtml(lines, code, id)                              +
   `</div>`;
  // console.log('blockHtml:', blockHtml);
  const data  = {blockHtml};
  const atEnd = (toIndex === undefined);
  if(!atEnd) data.toIndex = toIndex;
  await comm.send('insertBlock', data);
  log(`added block ${id} with ${block.lines.length} line(s) at ${atEnd ? 'end' : toIndex}`);
}

async function initWebviewHtml(editor) {
  const prismCss = await utils.readTxt(true, 'prism', 'themes', `prism-${theme}.css`);
  const iframeCss = prismCss + lineNumCss + iframeCssIn;

  log(`reading language file for ${language}`);
  let languageJs = await utils.readTxt(false, 'prism', 
                                  'languages', `prism-${language}.min.js`);
  if(languageJs === null) {
    log('errinfo', 'Unknown language, select one.');
    languageJs = '';
    language   = 'unknown';
  }
  else {
    let langTxt = languageJs;
    while(true) { 
      const matches = /Prism\.languages\.extend\s*\(\s*["'](.*?)["']/.exec(langTxt);
      if(!matches) break;
      const extLang = matches[1];
      langTxt = await utils.readTxt(false, 'prism', 
                                    'languages', `prism-${extLang}.min.js`);
      if(langTxt === null) break;
      log(`language ${language} extends ${extLang}`);
      languageJs = langTxt + languageJs;
    }
  }
  prePrismJs += `window.defstackLanguage = "${language}";\n` +
                `window.defstackTheme    = "${theme}";\n`;

  const iframeJs = (prePrismJs + prismCoreJs + languageJs + 
                    keepMarkupJs + lineNumJs + keepEscJs + iframeJsIn); 

  const document   = editor.document;
  const config     = vscode.workspace.getConfiguration('editor', document.uri);
  const fontFamily = ` */ font-family: ${config.fontFamily};   /* `;
  const fontWeight = ` */ font-weight: ${config.fontWeight};   /* `;
  const fontSize   = ` */ font-size:   ${config.fontSize}px;   /* `;
  const headerHtml = ` --> ${await hdrHtml()} <!-- `;

  const iframeHtml = (iframeHtmlIn
      .replace('**iframeCss**',  ` */ ${iframeCss} /*`)
      .replace('**iframeJs**',   iframeJs)
      .replace('**fontFamily**', fontFamily)
      .replace('**fontSize**',   fontSize)
      .replace('**fontWeight**', fontWeight)
      .replace('**headerHtml**', headerHtml)
      )
      .replaceAll(/"/g, '&quot;');

  const html = webviewHtml
      .replace('**webviewJs**',  webviewJs)
      .replace('**iframeHtml**', iframeHtml);
      
  webview.html = html;
}

function showInWebview(msg) {
  if(webview) {
    const msgHtml = // doesn't work in css file(?), even with !important
       `<div style="background: var(--vscode-editor-background);
                   color: var(--vscode-editor-foreground);
                   font-size:16px; font-weight:bold;"> 
          ${msg} 
        </div>`;
    webview.html = msgHtml;
  }
  else log('info', msg);
}

function markupRefs(line) {
  let html = line.text;
  html = html.replaceAll(/&/g, "\u0001")
             .replaceAll(/</g, "\u0002")
             .replaceAll(/>/g, "\u0003");
  for(let idx = line.words.length-1; idx >= 0; idx--) {
    const word = line.words[idx];
    const endOfs = word.endWordOfs;
    html = html.slice(0, endOfs) + '</span>' + html.slice(endOfs);
    const span = `<span id="${word.id}" class="hover ref-span">`;
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

module.exports = {init, setTheme, setLanguage, initWebviewHtml, 
                  markupRefs, addEmptyBlockToView, addBlockToView, showInWebview};
