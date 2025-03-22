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

function setLanguage(editor) {
  const document  = editor.document;
  const vscLangId = document.languageId;
  language = vscLangIdToPrism[vscLangId];
  language ??= vscLangId;
  comm.send('setLanguage', {language});
  log('set language:', language);
}

async function langSelectHtml() {
  let options = `<select id="lang-select-hdr" readonly="true">`;
  const files = await utils.readDirByRelPath('prism', 'languages');
  for(const file of files) {
    const matches = /^prism-(.*)\.min\.js$/.exec(file);
    if(!matches) continue;
    const lang = matches[1];
    options += `<option value="${lang}">${lang}</option>\n`;
  }
  return options + `</select>`  ;
}

function setTheme(editor) {
  const document = editor.document;
  theme = context.globalState.get('theme', 'dark');
  comm.send('setTheme', {theme});
  log('setTheme:', theme);
}

// context.globalState.update('theme', theme);

async function themeSelectHtml() {
  let options = `<select id="theme-select-hdr" readonly="true">`;
  const files = await utils.readDirByRelPath('prism', 'themes');
  for(const file of files) {
    let isMin = true;
    let matches = /^prism-(.*)(\.min)\.css$/.exec(file);
    if(!matches) {
      isMin = false;
      matches = /^prism-(.*)\.css$/.exec(file);
    }
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
  const document = editor.document;
  const prismCss = await utils.readTxt(true, 
                                          'prism', 'themes', 'prism.css');
                                          // 'prism', 'themes', 'prism-a11y-dark.css');
  const iframeCss = prismCss + lineNumCss + iframeCssIn;

  const langClike = await utils.readTxt(false, 
                                  'prism', 'languages', 'prism-clike.min.js');
  const langJavascript = await utils.readTxt(false, 
                            'prism', 'prism-javascript.js');
  const iframeJs = (prePrismJs + prismCoreJs + langClike + langJavascript + 
                    keepMarkupJs + lineNumJs + keepEscJs + iframeJsIn); 

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

module.exports = {setTheme, setLanguage, init, initWebviewHtml, 
                  addEmptyBlockToView, addBlockToView, 
                  showInWebview, markupRefs};


/*
const themeMapping = {
    "Dark+ (default dark)": "prism-dark",
    "Monokai": "prism-monokai",
    "One Dark": "prism-one-dark",
    "Solarized Dark": "prism-solarized-dark",
    "Dracula": "prism-dracula",
    "Light+ (default light)": "prism-light",
    "Solarized Light": "prism-solarized-light"
};

  function isLightTheme() {
    const currentTheme = vscode.workspace.getConfiguration('workbench').get('colorTheme');
    const darkThemes = [
        'Dark+ (default dark)',
        'Monokai',
        'Abyss',
        'One Dark Pro',
        'Dracula',
        'Night Owl',
        'Cobalt2',
        'Shades of Purple',
        'One Dark',
        'Solarized Dark',
        'SynthWave ’84',
        'Material Theme Darker',
        'Nightfall',
        'Vibrancy',
        'Palenight',
        'Gruvbox Dark'
    ];
    const lightThemes = [
        'Light+ (default light)',
        'Quiet Light',
        'Solarized Light',
        'GitHub Light',
        'Kimbie Light',
        'Ayu Light',
        'Beauteous',
        'Atom One Light',
        'Cobalt Light',
        'Palenight Light',
        'Blueberry',
        'Horizon Light',
        'Winter Light'
    ];
    return lightThemes.some(theme => currentTheme.includes(theme));
  }
*/

