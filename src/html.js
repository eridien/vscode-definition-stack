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

function init(contextIn, webviewIn) {
  context = contextIn;
  webview = webviewIn;
  webview.html = "";
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
  const lineNumCss = await utils.readTxt(context, true, 
            'prism', 'plugins', 'line-numbers', 'prism-line-numbers.css');
  const cssContent = prismCss + lineNumCss;

  const prePrismJs = `
    console.log('webview started');
    window.Prism = window.Prism || {};
		window.Prism.manual = true;
  `;
  const prismCoreJs = await utils.readTxt(context, false, 
                                                'prism', 'prism-core.js');
  const langClike = await utils.readTxt(context, false, 
                                  'prism', 'languages', 'prism-clike.js');
  const langJavascript = await utils.readTxt(context, false, 
                            'prism', 'languages', 'prism-javascript.js');
  const lineNumJs = await utils.readTxt(context, false, 
            'prism', 'plugins', 'line-numbers', 'prism-line-numbers.js');
  const defStkJs = await utils.readTxt(context, false, 
                                                     'src', 'script.js');
  const jsContent  = prePrismJs + prismCoreJs + 
                     langClike + langJavascript + 
                     lineNumJs + defStkJs;

  const config     = vscode.workspace.getConfiguration('editor', document.uri);
  const fontFamily = config.fontFamily;
  const fontWeight = config.fontWeight;
  const fontSize   = config.fontSize + 'px';

  const html = getPageTemplate()
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

function getPageTemplate() { return `

  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        html, body { height: 100vh; margin: 0; padding: 0; }
        iframe { width: 100%; height: 100vh; border: none; }
      </style>
      <script language="javascript" defer>
        document.addEventListener('DOMContentLoaded', () => {
          const vscode = acquireVsCodeApi();
          const iframe = document.getElementById('defStackIframe');
          console.log('webview started, iframe:', iframe);

          // Receive a message from anywhere
          window.addEventListener('message', event => {
            const message = event.data;
            // console.log('webview received message:', message);
            if(message.src === 'extension') {
              // console.log('Received message from extension:', message);
              // post the message to the iframe
              message.src = 'webview';
              iframe.contentWindow.postMessage(message, '*');
              return;
            }
            if(message.src === 'iframe') {
              // console.log('Received message from iframe:', message);
              // post the message to the extension
              message.src = 'webview';
              vscode.postMessage(message);
              return;
            }
          });
        });
      </script
    </head>
    <body>
      <iframe id="defStackIframe" srcdoc="

        <!DOCTYPE html>
        <html lang='en'>
          <head>
            <meta charset='UTF-8'>
            <meta name='viewport' 
                  content='width=device-width, initial-scale=1.0'>
            <style>
              **cssContent**
            </style>
            <script language='javascript' defer>
              **jsContent**
            </script>
          </head>
          <body style='font-weight:**fontWeight**; 
                       font-size:**fontSize**;
                       font-family:**fontFamily**;'>
          </body>
        </html>

    "></iframe>
    </body>
  </html>
  
`}

module.exports = {setLanguage, init, addpre, setAllViewHtml, showMsgInPage};

