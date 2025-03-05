const vscode        = require('vscode');
const edit          = require('./editor.js');
const utils         = require('./utils.js');
const log           = utils.getLog('symbol');

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

async function processOneBlock(blockLocation) {
  const blockUri   = blockLocation.uri;
  const blockRange = blockLocation.range;
  const workSpace  = vscode.workspace;
  const wsPath = workSpace.getWorkspaceFolder(blockUri).uri.path; 
  const wsPathLen = wsPath.length;
 
  const blockDoc = 
          await workSpace.openTextDocument(blockUri);
  const text = blockDoc.getText(blockRange);
  const wordAndPosArr = findWordsInText(text, blockRange.start);
  const defLocs = new Set();
  for(const wordAndPos of wordAndPosArr) {
    const definitions = await vscode.commands.executeCommand(
                              'vscode.executeDefinitionProvider',
                                  blockUri, wordAndPos.position);
    defloop:
    for(const definition of definitions) {
      // let defRange   = definition.targetRange;
      // let defEndLine = defRange.end.line;
      // let defEndChar = defRange.end.character;
      // if(defRange.end.character > 0) {
      //     defEndLine++;
      //     defEndChar = 0;
      // }
      // const defEndPos = new vscode.Position(defEndLine, defEndChar);
      // defRange = new vscode.Range( 
      //                   definition.targetRange.start, defEndPos);
      const definitionLoc = new vscode.Location(
                              definition.targetUri, 
                              definition.targetRange);
                              
    // if(definition.targetRange.start.line == 0 &&
    //      definition.targetRange.end.line == 0) debugger;


      const defPath = definitionLoc.uri.path;
      if(utils.containsLocation(blockLocation, definitionLoc)) continue;
      for(const ignorePath of ignorePaths) {
        if(defPath.includes(ignorePath)) continue defloop;
      }
      const defLocStr = JSON.stringify(definitionLoc);
      if(defLocs.has(defLocStr)) continue;
      defLocs.add(defLocStr);
      const defDoc = await workSpace.openTextDocument(definitionLoc.uri);
      const text =
          await utils.getTextFromDoc(defDoc, definitionLoc);
      const defRange = definitionLoc.range;
      let srcPath = blockUri.path.split('/').slice(-1)[0];
      let tgtPath = defPath      .split('/').slice(-1)[0];
      const hdrLine = (`${wordAndPos.word}(${srcPath}` +
        `[${blockRange.start.line+1}:${blockRange.end.line+1}]) ->
          ${tgtPath}` +
        `[${defRange.start.line+1}:${defRange.end.line+1}]`)
        .replaceAll(/\s+/g, ' ');
      await edit.addText(hdrLine + '\n',   'end');
      await edit.addText(text    + '\n\n', 'end');

      log(wordAndPos.word, 
          defPath.split('/').slice(-1)[0], 
          definitionLoc.range.start.line,
          definitionLoc.range.end.line);

      await processOneBlock(definitionLoc);
    }
  }
}

async function processBlocks(document, selection) {
  let blockLoc = await findSurroundingBlock(document, selection);
  if(!blockLoc) {
    await utils.sleep(2000);
    blockLoc = await findSurroundingBlock(document, selection);
    if(!blockLoc) {
      log('err', 'No block found');
      return;
    }
  }
  await edit.clearEditor();
  await processOneBlock(blockLoc);
}

module.exports = { processBlocks };
