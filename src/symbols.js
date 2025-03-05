const vscode        = require('vscode');
const edit          = require('./editor.js');
const utils         = require('./utils.js');
const log           = utils.getLog('symbol');
const reservedWords = require('reserved-words');

const ignorePaths = ['node_modules', '.d.ts'];

const extToLangId         = {'vue': 'vue'}
const langsWithDollarSign = ['javascript', 'typescript', 'vue'];

const isReservedWord = function(langId, word) {
  switch(langId) {
    case 'javascript':
    case 'typescript':
    case 'vue':
      const version = 6;
      return reservedWords.check(word, version);
    default:
      return false;
  }
}

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

function findWordsInText(langId, text, positionIn) {
  const lines = text.split('\n');
  const ds = langsWithDollarSign.includes(langId) ? '$' : '';
  const regexString = `\\b[a-zA-Z_${ds}][\\w${ds}]*?\\b`;
  const wordRegex = new RegExp(regexString, 'g');
  const wordAndPosArr = [];
  let match;
  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0];
    if (!isReservedWord(langId, word)) {
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
  }
  return wordAndPosArr;
}

async function processOneBlock(blockLocation) {
  const blockUri   = blockLocation.uri;
  let  blockPath  = blockUri.path;
  const blockRange = blockLocation.range;
  const workSpace  = vscode.workspace;
  let wsPath     = 
          workSpace.getWorkspaceFolder(blockUri).uri.path; 
  blockPath = utils.fixDriveLetter(blockPath);
  wsPath    = utils.fixDriveLetter(wsPath) + '/';
 
  const blockDoc = 
          await workSpace.openTextDocument(blockUri);
  let langId;
  const ext = blockPath.split('.').slice(-1)[0];
  if(extToLangId[ext]) langId = extToLangId[ext];
  else                 langId = blockDoc.languageId;
  const text = blockDoc.getText(blockRange);
  const wordAndPosArr = findWordsInText(
              langId, text, blockRange.start);
  const defLocs = new Set();
  for(const wordAndPos of wordAndPosArr) {
    const definitions = await vscode.commands.executeCommand(
                              'vscode.executeDefinitionProvider',
                                  blockUri, wordAndPos.position);
    defloop:
    for(const definition of definitions) {
      const definitionLoc = new vscode.Location(
                      definition.targetUri, definition.targetRange);
      const defPath = definitionLoc.uri.path;
      if(utils.containsLocation(blockLocation, definitionLoc)) continue;
      for(const ignorePath of ignorePaths) {
        if(defPath.includes(ignorePath)) continue defloop;
      }
      const defLocStr = JSON.stringify(definitionLoc);
      if(defLocs.has(defLocStr)) continue;
      defLocs.add(defLocStr);
      const text =
          await utils.getTextFromDoc(blockDoc, definitionLoc);
      let relPath = defPath.replace(wsPath, '');
      edit.addText(`${relPath}`, 'end');
      edit.addText(text, 'end');
      edit.addText('\n', 'end');

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
    await (new Promise(resolve => setTimeout(resolve, 2000)));
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
