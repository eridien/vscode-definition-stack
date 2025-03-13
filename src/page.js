const vscode = require('vscode');
const webv   = require('./webview.js');
const html   = require('./html.js');
const comm   = require('./comm.js');
const utils  = require('./utils.js');
const log    = utils.getLog('PAGE');

const ignorePaths = ['node_modules', '.d.ts'];

function getSymbolsRecursive(rootSymbol) {
  const symbols = [];
  function recursPush(symbol) {
    symbols.push(symbol);
    if (symbol.children) 
      symbol.children.forEach(recursPush);
  }
  recursPush(rootSymbol);
  return symbols;
}

function convertSymToBlock(document, symbol) {
  const name         = symbol.name;
  const location     = new vscode.Location(document.uri, symbol.range);
  const symStartLine = symbol.range.start.line;
  const symEndLine   = symbol.range.end.line;
  const symStartChar = symbol.range.start.character;
  const symEndChar   = symbol.range.end.character;
  const lines = [];
  for(let lineNum  = symStartLine; 
          lineNum <= symEndLine; 
          lineNum++) {
    const line = document.lineAt(lineNum);
    let startSymCharOfs = 0;
    let endSymCharOfs = line.text.length;
    if(lineNum == symStartLine) startSymCharOfs = symStartChar;
    if(lineNum == symEndLine)   endSymCharOfs  = symEndChar;
    line.startSymCharOfs = startSymCharOfs;
    line.endSymCharOfs   = endSymCharOfs;
    lines.push(line);
  }
  return {name, location, lines};
}

async function findSurroundingBlock(document, selectionRange) {
  try {
    const docTopSymbols = await vscode.commands.executeCommand(
             'vscode.executeDocumentSymbolProvider', document.uri);
    if (!docTopSymbols) return null;
    const allSymbols = docTopSymbols
              .flatMap(symbol => getSymbolsRecursive(symbol))
    // Find the smallest containing symbol
    const containingBlockSymbol = allSymbols
      .filter(block => utils.containsRange(block.range, selectionRange))
      .sort((a, b) => utils.getRangeSize(a.range) 
                    - utils.getRangeSize(b.range))[0];
    if (containingBlockSymbol)
      return convertSymToBlock(document, containingBlockSymbol);
    return null;
  } 
  catch (error) {
    log('infoerr', error.message);
    return null;
  }
}

function addWordsToBlock(block) {
  const {lines} = block;
  const regexString = `\\b[a-zA-Z_$][\\w$]*?\\b`;
  const wordRegex = new RegExp(regexString, 'g');
  for(const line of lines) {
    const words = [];
    let match;
    const lineText = line.text.slice(line.startSymCharOfs, line.endSymCharOfs);
    while ((match = wordRegex.exec(lineText)) !== null) {
      const name = match[0]
      const startWordOfs = line.startSymCharOfs + wordRegex.lastIndex - name.length;
      const endWordOfs   = wordRegex.lastIndex;
      words.push({name, startWordOfs, endWordOfs});;
    }
    line.words = words;
    line.id    = utils.getUniqueId();
    line.html  = html.highlightWords(line.text, utils.getUniqueId(), 'ref');
  }
}

async function sendBlockToPage(block) {
  const {name, location, lines} = block;
  const relPath = location.uri.path.slice(block.projPath.length+1);
  log(name.padEnd(15), relPath);
  await webv.addBanner(name, relPath);
  let minWsIdx = Number.MAX_VALUE;
  for(const line of lines) {
    const wsIdx = line.firstNonWhitespaceCharacterIndex;
    minWsIdx = Math.min(minWsIdx, wsIdx);
  }
  let text = "";
  for(const line of lines)
    text += line.text.slice(minWsIdx) + "\n";
  const range = location.range
  await webv.addCode(text, range.start.line+1);
}

let defLocSet = new Set();
let defCount  = 0;

async function processBlock(block) {
  const blockLocation = block.location;
  const blockUri      = blockLocation.uri;
  addWordsToBlock(block);
  for(const line of block.lines) {
    const words = line.words;
    for(let idx = 0; idx < words.length; idx++) {
      const word = line.words[idx];
      const name = word.name;
      const startWordPos = new vscode.Position(
                                line.lineNumber, word.startWordOfs);
      const definitions = await vscode.commands.executeCommand(
                 'vscode.executeDefinitionProvider', blockUri, startWordPos);
      if (definitions.length == 0) {
        words.splice(idx, 1);
        continue;
      }
      word.definitions = definitions;
      defloop:
      for(const definition of definitions) {
        const defUri     = definition.targetUri;
        const defRange   = definition.targetRange;
        const defPath    = defUri.path;
        const defDoc     = await vscode.workspace.openTextDocument(defUri);
        const defLoc     = new vscode.Location(defUri, defRange);
        if(utils.containsLocation(blockLocation, defLoc)) continue defloop;
        for(const ignorePath of ignorePaths) {
          if(defPath.includes(ignorePath)) continue defloop;
        }
        const defLocStr = JSON.stringify({defUri, defRange});
        if(defLocSet.has(defLocStr)) continue defloop;
        defLocSet.add(defLocStr);
        defCount++;

        const text = defDoc.getText(defRange);
        const lines = text.split('\n');
        lines.forEach((line, lineNum) => {
          let startSymCharOfs = 0;
          let endSymCharOfs = line.text.length;


          
          if(lineNum == 0)              startSymCharOfs = symStartChar;
          if(lineNum == lines.length-1) endSymCharOfs   = symEndChar;
          line.startSymCharOfs = startSymCharOfs;
          line.endSymCharOfs   = endSymCharOfs;
          lines.push(line);
        });


        const block = {name, location, lines};
        await sendBlockToPage(block);


      }
    }
  }
}

async function startBuildingPage(contextIn, textEditor) {
  context = contextIn;
  const document  = textEditor.document;
  const selection = textEditor.selection; 
  const projIdx   = utils.getProjectIdx(document);
  let block = await findSurroundingBlock(document, selection);
  if(!block) {
    await utils.sleep(2000);
    block = await findSurroundingBlock(document, selection);
    if(!block) {
      html.showMsgInPage('The selection is not in a block.');
      return;
    }
  }
  block.projPath = vscode.workspace.workspaceFolders[projIdx].uri.path;
  html.setLanguage(textEditor);
  await processBlock(block);
  if(defCount == 0) { html.showMsgInPage(
                       `Found no symbol in selection with a definition.`);
  }
  else await html.setAllViewHtml(textEditor);
}

async function startBuildingPageWhenReady(contextIn, textEditor) {
  defLocSet = new Set();
  comm.clearRecvCallbacks();
  comm.registerWebviewRecv('ready', async () => {
    await startBuildingPage(contextIn, textEditor);
  });
}
module.exports = { startBuildingPageWhenReady };
