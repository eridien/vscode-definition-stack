const vscode = require('vscode');
const webv   = require('./webview.js');
const comm   = require('./def-stk-comm.js');
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
    const blockLine = document.lineAt(lineNum);
    let startCharOfs = 0;
    let endCharOfs   = line.text.length;
    if(lineNum == symStartLine) startCharOfs = symStartChar;
    if(lineNum == symEndLine)   endCharOfs   = symEndChar;
    lines.push({line, startCharOfs, endCharOfs});
  }
  return {symbol, lines};
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

function findWordsInBlock(block) {
  const {symbol, lines} = block;
  const regexString = `\\b[a-zA-Z_$][\\w$]*?\\b`;
  const wordRegex = new RegExp(regexString, 'g');
  const wordAndPosArr = [];
  for(const line of lines) {
  let match;
  while ((match = wordRegex.exec(text)) !== null) {
    const lineText = line.line.text;
    const word = match[0];
    let lineCharOfs = positionIn.character;
    let charOfs = wordRegex.lastIndex - word.length;
    let lineOfs = 0;
    let position;
    for(const [lineNum, lineStr] of lines.entries()) {
      if(charOfs < (lineOfs + lineStr.length)) {
        const line = positionIn.line + lineNum;
        const char = lineCharOfs + charOfs - lineOfs;
        position = new vscode.Position(line, char);
        break;
      }
      lineCharOfs = 0;
      lineOfs += lineStr.length + 1;
    }
    const wordAndPos = {word, position};
    wordAndPosArr.push(wordAndPos);
  }
  }
  return wordAndPosArr;
}

let projPath = "";
let defLocs  = new Set();
let defCount = 0;

async function processBlock(blockLocation) {
  const blockUri   = blockLocation.uri;
  const blockRange = blockLocation.range;
  const workSpace  = vscode.workspace;
  const blockDoc = 
          await workSpace.openTextDocument(blockUri);

  const wordAndPosArr = findWordsInBlock(blockLocation);

  for(const wordAndPos of wordAndPosArr) {
    const definitions = await vscode.commands.executeCommand(
          'vscode.executeDefinitionProvider', blockUri, wordAndPos.position);
    defloop:
    for(const definition of definitions) {
      const defUri        = definition.targetUri;
      const defRange      = definition.targetRange;
      const startLine     = defRange.start.line;
      const endLine       = defRange.end.line;
      const definitionLoc = new vscode.Location(defUri, defRange);
      const defPath       = defUri.path;
      const defRelPath    = defPath.slice(projPath.length+1);

      if(utils.containsLocation(blockLocation, definitionLoc)) continue;
      for(const ignorePath of ignorePaths) {
        if(defPath.includes(ignorePath)) continue defloop;
      }
      const defLocStr = JSON.stringify({defPath, startLine, endLine});
      if(defLocs.has(defLocStr)) continue;
      defLocs.add(defLocStr);
      defCount++;

      log(wordAndPos.word.padEnd(15),       defRelPath);
      await webv.addBanner(wordAndPos.word, defRelPath);

      const defDoc = await workSpace.openTextDocument(definitionLoc.uri);
      const text =
          await utils.getTextFromDoc(defDoc, definitionLoc);
      await webv.addCode(text, startLine+1);
    }
  }
}

async function startBuildingPage(contextIn, textEditor) {
  context = contextIn;
  const document  = textEditor.document;
  const selection = textEditor.selection; 
  const projIdx   = utils.getProjectIdx(document);
  projPath = vscode.workspace.workspaceFolders[projIdx].uri.path;
  let block = await findSurroundingBlock(document, selection);
  if(!block) {
    await utils.sleep(2000);
    block = await findSurroundingBlock(document, selection);
    if(!block) {
      webv.showMsgInPage('The selection is not in a block.');
      return;
    }
  }
  defLocs  = new Set();
  defCount = 0;
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
