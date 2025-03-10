const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('symbol');
const webv   = require('./webview.js');

const ignorePaths = ['node_modules', '.d.ts'];

function getSymbolsRecursive(symbolIn) {
  const symbols = [];
  function recursPush(symbol) {
    symbols.push(symbol);
    if (symbol.children) 
      symbol.children.forEach(recursPush);
  }
  recursPush(symbolIn);
  return symbols;
}

async function findSurroundingBlock(document, selection) {
  try {
    const docTopSymbols = await vscode.commands.executeCommand(
             'vscode.executeDocumentSymbolProvider', document.uri);
    if (!docTopSymbols) return null;
    const allSymbols = docTopSymbols
              .flatMap(symbol => getSymbolsRecursive(symbol))
    // Find the smallest containing symbol
    const containingBlockSymbol = allSymbols
      .filter(block => utils.containsRange(block.range, selection))
      .sort((a, b) => utils.getRangeSize(a.range) 
                    - utils.getRangeSize(b.range))[0];
    if (containingBlockSymbol) {
      // log({containingBlockSymbol});
      return containingBlockSymbol.location;
    }
    return null;
  } 
  catch (error) {
    log('infoerr', error.message);
    return null;
  }
}

function findWordsInText(text, positionIn) {
  const lines = text.split('\n');
  const regexString = `\\b[a-zA-Z_$][\\w$]*?\\b`;
  const wordRegex = new RegExp(regexString, 'g');
  const wordAndPosArr = [];
  let match;
  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0];
    let lineZeroCharOfs = positionIn.character;
    let charOfs = wordRegex.lastIndex - word.length;
    let lineOfs = 0;
    let position;
    for(const [lineNum, lineStr] of lines.entries()) {
      if(charOfs < (lineOfs + lineStr.length)) {
        const line = positionIn.line + lineNum;
        const char = lineZeroCharOfs + charOfs - lineOfs;
        position = new vscode.Position(line, char);
        break;
      }
      lineZeroCharOfs = 0;
      lineOfs += lineStr.length + 1;
    }
    const wordAndPos = {word, position};
    // log('word', wordAndPosArr.length, {wordAndPos});
    wordAndPosArr.push(wordAndPos);
  }
  return wordAndPosArr;
}

let defLocs = new Set();
let defCount = 0;

async function processOneBlock(blockLocation) {
  const blockUri   = blockLocation.uri;
  const blockRange = blockLocation.range;
  const workSpace  = vscode.workspace;
 
  const blockDoc = 
          await workSpace.openTextDocument(blockUri);
  const text = blockDoc.getText(blockRange);
  const wordAndPosArr = findWordsInText(text, blockRange.start);
  for(const wordAndPos of wordAndPosArr) {
    const definitions = await vscode.commands.executeCommand(
                              'vscode.executeDefinitionProvider',
                                  blockUri, wordAndPos.position);
    defCount += definitions.length;
    defloop:
    for(const definition of definitions) {
      const defUri        = definition.targetUri;
      const defRange      = definition.targetRange;
      const startLine     = defRange.start.line;
      const endLine       = defRange.end.line;
      const definitionLoc = new vscode.Location(defUri, defRange);
      const defPath       = defUri.path;

      if(utils.containsLocation(blockLocation, definitionLoc)) continue;
      for(const ignorePath of ignorePaths) {
        if(defPath.includes(ignorePath)) continue defloop;
      }
      const defLocStr = JSON.stringify({defPath, startLine, endLine});
      log(defLocStr);
      if(defLocs.has(defLocStr)) continue;
      defLocs.add(defLocStr);

      const projIdx = 0;
      const projPath = vscode.workspace.workspaceFolders[projIdx].uri.path;
      console.log({defPath, projPath});
      const tgtPath = defPath.slice(projPath.length+1);
      await webv.addBanner(wordAndPos.word, tgtPath);

      const defDoc = await workSpace.openTextDocument(definitionLoc.uri);
      const text =
          await utils.getTextFromDoc(defDoc, definitionLoc);
      await webv.addCode(text, startLine+1);
      await processOneBlock(definitionLoc);
    }
  }
}

async function generatePage(contextIn, document, selection) {
  context = contextIn;
  let blockLoc = await findSurroundingBlock(document, selection);
  if(!blockLoc) {
    await utils.sleep(2000);
    blockLoc = await findSurroundingBlock(document, selection);
    if(!blockLoc) {
      log('info', 'The selection is not in a block.');
      return;
    }
  }
  defLocs = new Set();
  await processOneBlock(blockLoc);
  if(defCount == 0) 
    log('info', `Found no symbol with a definition.`);
  else
    webv.renderPage();
}

module.exports = { generatePage };
