const vscode = require('vscode');
const webv   = require('./webview.js');
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
  const symStartLine = symbol.range.start.line;
  const symEndLine   = symbol.range.end.line;
  const symStartChar = symbol.range.start.character;
  const symEndChar   = symbol.range.end.character;
  const lines = [];
  for(let lineNum  = symStartLine; 
          lineNum <= symEndLine; 
          lineNum++) {
    const line = document.lineAt(lineNum);
    let startCharOfs = 0;
    let endCharOfs = line.text.length;
    if(lineNum == symStartLine) startCharOfs = symStartChar;
    if(lineNum == symEndLine)   endCharOfs   = symEndChar;
    line.startCharOfs = startCharOfs;
    line.endCharOfs   = endCharOfs;
    lines.push(line);
  }
  const location = new vscode.Location(document.uri, symbol.range);
  return {symbol, location, lines};
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
    const lineText = line.text.slice(line.startCharOfs, line.endCharOfs);
    while ((match = wordRegex.exec(lineText)) !== null) {
      const text = match[0]
      const startWordOfs = wordRegex.lastIndex - text.length;
      const endWordOfs   = wordRegex.lastIndex;
      words.push({text, startWordOfs, endWordOfs});;
    }
    line.words = words;
  }
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
      const startWordPos = new vscode.Position(
              line.lineNumber, line.startCharOfs + word.startWordOfs);
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
        const defDoc     = await vscode.workspace.openTextDocument(defUri);
        const defRange   = definition.targetRange;
        const defPath    = defUri.path;
        const defRelPath = defPath.slice(block.projPath.length+1);
        const defLoc     = new vscode.Location(defUri, defRange);
        if(utils.containsLocation(blockLocation, defLoc)) continue defloop;
        for(const ignorePath of ignorePaths) {
          if(defPath.includes(ignorePath)) continue defloop;
        }
        const defLocStr = JSON.stringify({defUri, defRange});
        if(defLocSet.has(defLocStr)) continue defloop;
        defLocSet.add(defLocStr);
        defCount++;
        log(word.text.padEnd(15), defRelPath);
        await webv.addBanner(word.text, defRelPath);
        let defText = "";
        let minWsIdx = Number.MAX_VALUE;
        for(let lineNum  = defRange.start.line;
                lineNum <= defRange.end.line;
                lineNum++) {
          const wsIdx = defDoc.lineAt(lineNum)
                              .firstNonWhitespaceCharacterIndex;
          minWsIdx = Math.min(minWsIdx, wsIdx);
        }
        for(let lineNum  = defRange.start.line;
                lineNum <= defRange.end.line;
                lineNum++) {
          defText += defDoc.lineAt(lineNum).text
                           .slice(minWsIdx) + "\n";
        }
        await webv.addCode(defText, defRange.start.line+1);
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
      webv.showMsgInPage('The selection is not in a block.');
      return;
    }
  }
  block.projPath = vscode.workspace.workspaceFolders[projIdx].uri.path;
  webv.setLanguage(textEditor);
  await processBlock(block);
  if(defCount == 0) {
    webv.showMsgInPage(
       `Found no symbol in selection with a definition.`);
  }
  else await webv.setAllViewHtml(textEditor);
}

async function startBuildingPageWhenReady(contextIn, textEditor) {
  comm.clearRecvCallbacks();
  comm.registerWebviewRecv('ready', async () => {
    await startBuildingPage(contextIn, textEditor);
  });
}
module.exports = { startBuildingPageWhenReady };
