const vscode = require('vscode');
const comm   = require('./comm.js');
const sett   = require('./settings.js');
const svg    = require('../images/svg.js');
const utils  = require('./utils.js');
const log    = utils.getLog('HTML');

let webv;

const refWordColor = '#d4cece';
const selWordColor = '#d3ca97';

let webview, context, language, theme, fontSize, languageIdMappings;
let webviewHtml, webviewJs, iframeHtmlIn, iframeJsIn;
let iframeCssIn, lineNumCss, prePrismJs, prismCoreJs;
let lineNumJs, keepMarkupJs, keepEscJs;
let colorPickerVal, colorSelPickerVal

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
  webv    = require('./webview.js');
  context = contextIn;
  webview = webviewIn;
  webview.html = "";
  comm.registerWebviewRecv('themeSelChange',       themeSelChange);
  comm.registerWebviewRecv('colorPickerValChg',    colorPickerValChg);
  comm.registerWebviewRecv('colorSelPickerValChg', colorSelPickerValChg);
  comm.registerWebviewRecv('fontSizeChange',       fontSizeChange);
  await loadConstFiles();
}

function setTheme() {
  theme = context.globalState.get('theme', 'dark');
  // log('setTheme:', theme);
}

function setFontSize() {
  fontSize = utils.pxToNum(context.globalState.get('fontSize', '1px'));
  log('setFontSize:', fontSize);
}

function setColorPickerVal() {
  colorPickerVal = context.globalState
                          .get('colorPickerVal', refWordColor);
  log('setColorPickerVal:', colorPickerVal);
}

function colorPickerValChg(data) {
  colorPickerVal = data.colorPickerVal;
  context.globalState.update('colorPickerVal', colorPickerVal);
  log('colorPickerValChg:', colorPickerVal);
}

function setColorSelPickerVal() {
  colorSelPickerVal = context.globalState
                             .get('colorSelPickerVal', selWordColor);
  log('setColorSelPickerVal:', colorSelPickerVal);
}

function colorSelPickerValChg(data) {
  colorSelPickerVal = data.colorSelPickerVal;
  context.globalState.update('colorSelPickerVal', colorSelPickerVal);
  log('colorSelPickerValChg:', colorSelPickerVal);
}

async function reloadWebview() {
  await utils.init(context);
  await webv.init(context);
  await initWebviewHtml();
}

async function themeSelChange(data) {
  const themeIn = data.theme;
  if(themeIn == theme) return;
  theme = themeIn;
  context.globalState.update('theme', theme);
  // log('theme changed:', theme);
  reloadWebview();
}

async function fontSizeChange(data) {
  const fontSizeIn = utils.pxToNum(data.fontSize);
  if(fontSizeIn == fontSize) return;
  fontSize = fontSizeIn;
  context.globalState.update('fontSize', utils.numToPx(fontSize));
  log('fontSize changed:', fontSize);
  reloadWebview();
}

function setLanguageIdMappings() {
  const config = vscode.workspace.getConfiguration('definition-stack');
  languageIdMappings = config.get('languageIdMappings');
}
sett.registerSettingCallback('languageIdMappings', setLanguageIdMappings);

function setLanguage(editor) {
  const document = editor.document;
  const vscLangId = document.languageId;
  language = languageIdMappings[vscLangId];
  language ??= vscLangId;
  log('set language:', language);
}

async function themeSelectHtml() {
  let options = `<select id="theme-select-hdr" readonly="true">`;
  const files = await utils.readDirByRelPath('prism', 'themes');
  for(const file of files) {
    const matches = /^prism-(.*)\.css$/.exec(file);
    if(!matches) continue;
    const themeIn = matches[1];
    options += `<option value="${themeIn}" 
           ${themeIn == theme ? "selected" : ''}>${themeIn}</option>\n`;
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
    `<input type="color" id="ref-color"     value="${colorPickerVal}">
    <input type="color" id="ref-sel-color" value="${colorSelPickerVal}"
            style="margin-right:12rem;">` +
    svg.iconHtml('smallA', "iframe-hdr", "position:relative; top:9rem;") +
    svg.iconHtml('largeA', "iframe-hdr", "position:relative; top:9rem;") +
  `</div>`;
}

function bannerHtml(name, path, blkId, symbol) {
  const symbolTypeNum = symbol?.kind;
  const symbolType    = symbolTypeByKind(symbolTypeNum);
  return `<span class="banner">
            <div>` +
              svg.iconHtml('delete',   blkId) +
              svg.iconHtml('expand',   blkId, 'display:none') +
              svg.iconHtml('collapse', blkId) +
              svg.iconHtml('refsup',   blkId,
                              "position:relative; top:-.2rem;") +
              svg.iconHtml('isolate',  blkId) +
           `</div>
            <div class="banner-text"> 
              <span class="banner-type">${symbolType}</span> 
              <div style="display:${name ? "inline-block" : "none"};">
                <span id="${blkId}-banner-name" 
                      class="hover banner-name">${name}</span> in 
              </div>
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

let uniqueBlkId = 1;
function getUniqueBlkId() { return `ds-blk-${uniqueBlkId++}` }

async function getBlockHtml(block, fromRef) {
  const {id, name, relPath, lines} = block;
  let minWsIdx = Number.MAX_VALUE;
  for(const line of lines) {
    const wsIdx = line.firstNonWhitespaceCharacterIndex;
    minWsIdx = Math.min(minWsIdx, wsIdx);
  }
  let code = "";
  for(const line of lines)
    code += ((line.html.slice(minWsIdx)) + "\n");
  return `<div id="${id}" class="ds-block" from-ref="${fromRef}">` +
            bannerHtml(name, relPath, id, block.srcSymbol)         +
            codeHtml(lines, code, id)                              +
        `</div>`;
}

let config = null;

async function initWebviewHtml(editor) {
  const prismCss = await utils.readTxt(true, 'prism', 'themes', `prism-${theme}.css`);
  const iframeCss = prismCss + lineNumCss + iframeCssIn;
  // log(`reading language file for ${language}`);
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
      // log(`language ${language} extends ${extLang}`);
      languageJs = langTxt + languageJs;
    }
  }
  const iframeJs = (prePrismJs + prismCoreJs + languageJs + 
                    keepMarkupJs + lineNumJs + keepEscJs + iframeJsIn); 

  if(!editor && !config) {
    config = {};
    config.fontFamily = 'monospace';
    config.fontWeight = 'normal';
  }
  if(editor) {  
    const document = editor.document;
    config = vscode.workspace.getConfiguration('editor', document.uri);
  }
  const fontFamily = ` */ font-family: ${config.fontFamily};   /* `;
  const fontWeight = ` */ font-weight: ${config.fontWeight};   /* `;
  const headerHtml = ` --> ${await hdrHtml()} <!-- `;

  const iframeHtml = (iframeHtmlIn
      .replace('**iframeCss**',  ` */ ${iframeCss} /*`)
      .replace('**iframeJs**',   iframeJs)
      .replace('**fontFamily**', fontFamily)
      .replace('**fontWeight**', fontWeight)
      .replace('**headerHtml**', headerHtml)
      .replace('font-size:1px', 
               `font-size:${fontSize.toFixed(2)}px`)
      .replaceAll(/"/g, '&quot;'));

  const html = webviewHtml
      .replace('**webviewJs**',  webviewJs)
      .replace('**iframeHtml**', iframeHtml);
      
  webview.html = html;
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
    const span = `<span id="${word.id}" class="hover ref-span" 
                        style="background-color: ${colorPickerVal};
                        text-shadow:none;">`;
    const strtOfs = word.startWordOfs;
    html = html.slice(0, strtOfs) + span + html.slice(strtOfs);
  }
  line.html = html;
}

function symbolTypeByKind(kind) {
  return { 0: "File",
    1: "File", 2: "Module", 3: "Namespace", 4: "Package", 5: "Class", 6: "Method", 7: "Property",
    8: "Field", 9: "Constructor", 10: "Enum", 11: "Interface", 12: "Function", 13: "Variable",
    14: "Constant", 15: "String", 16: "Number", 17: "Boolean", 18: "Array", 19: "Object", 20: "Key",
    21: "Null", 22: "EnumMember", 23: "Struct", 24: "Event", 25: "Operator", 26: "TypeParameter" }
  [kind+1] ?? ""};

module.exports = {
    init, setTheme, setFontSize, setLanguage, setColorPickerVal, setColorSelPickerVal,
    initWebviewHtml, markupRefs, getBlockHtml, getUniqueBlkId, setLanguageIdMappings

};
