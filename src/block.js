const vscode = require('vscode');
const navi   = require('./navigate.js');
const html   = require('./html.js');
const comm   = require('./comm.js');
const sett   = require('./settings.js');
const utils  = require('./utils.js');
const log    = utils.getLog('BLCK');

let ignorePatternRegexes = [];

let blockByHash   = {};
let blocksByRefId = {};
let pathByBlkId   = {};

function init() {
  blockByHash   = {};
  blocksByRefId = {};
  pathByBlkId   = {};
}

function removeBlockFromCaches(block) {
  delete blockByHash[block.hash];
  delete pathByBlkId[block.id];
}

function getBlockByHash(hash) {
  return blockByHash[hash];
}

function getBlocksByRefId(refId) {
  return blocksByRefId[refId];
}

function getPathByBlkId(blockId) {
  return pathByBlkId[blockId];
}

function setPathByBlkId(blockId, path) {
  pathByBlkId[blockId] = path;
}

function parseAndSaveIgnoreFilePatterns(strIn) {
  const partsIn = strIn.split(',').map(part => part.trim());
  const ignoreFilePatterns = [];
  for(let i=0; i < partsIn.length; i++) {
    const part     = partsIn[i];
    const nextPart = partsIn[i+1];
    if(part === "") {
      if(ignoreFilePatterns.length > 0 && i < partsIn.length-1 && nextPart !== "") {
        ignoreFilePatterns[ignoreFilePatterns.length-1] += (',' + partsIn[i+1]);
        i++;
      }
      continue;
    }
    ignoreFilePatterns.push(part);
  }
  ignorePatternRegexes = ignoreFilePatterns.map(pattern => RegExp(pattern));
}
sett.registerSettingCallback('ignoreFilePatterns', parseAndSaveIgnoreFilePatterns);

function setIgnoreFilePatterns() {
  const config = vscode.workspace.getConfiguration('definition-stack');
  const ignoreFilePatternStr = config.get('ignoreFilePatterns');
  parseAndSaveIgnoreFilePatterns(ignoreFilePatternStr);
}

async function addDefs(block) {
  const blockLoc   = block.location;
  const blockUri   = blockLoc.uri;
  const blockRange = blockLoc.range;

  for(const line of block.lines) {
    let words = line.words;
    for(let idx = 0; idx < words.length; idx++) {
      const word = words[idx];
      const {name, startWordOfs} = word;
      const startWordPos = 
              new vscode.Position(line.lineNumber, startWordOfs);
      const definitions = await vscode.commands.executeCommand(
                 'vscode.executeDefinitionProvider', blockUri, startWordPos);
      if (definitions.length == 0) {
        delete words[idx];
        continue;
      }
      word.defBlocks = [];
      defloop:
      for(const definition of definitions) {
        const defRange = definition.targetRange ?? definition.range;
        if(defRange.start.line      == defRange.end.line  &&
           defRange.start.character == defRange.end.character) 
          continue;
        const blockPath = blockUri.path;
        const defUri    = definition.targetUri ?? definition.uri;
        const defPath   = defUri.path;
        const defLoc    = new vscode.Location(defUri, defRange);
        if(blockPath == defPath                         &&
           blockRange.start.line == defRange.start.line &&
           blockRange.end.line   == defRange.end.line) continue;
        if(utils.containsLocation(blockLoc, defLoc)) continue;
        for(const regex of ignorePatternRegexes) {
          if(regex.test(defPath)) continue defloop;
        }
        const defBlock = await getOrMakeBlock(name, defUri, defRange);
        word.defBlocks.push(defBlock);
      }
      if (word.defBlocks.length == 0) {
        delete words[idx];
        continue;
      }
      word.id = `${block.id}-ref-${uniqueRefId++}`;
    }
    words = words.filter(word => word);
    line.words = words;
    for(const word of words) 
      blocksByRefId[word.id] = [...word.defBlocks];
    html.markupRefs(line);
  }
}

async function addWordsAndDefs(block) {
  if(block.haveWordsAndDefs) return;
  block.haveWordsAndDefs = true;
  const {lines} = block;
  const regexString = `\\b[a-zA-Z_$][\\w$]*?\\b`;
  const wordRegex = new RegExp(regexString, 'g');
  for(const line of lines) {
    const words = [];
    let match;
    const lineText = line.text.slice(line.startCharOfs, line.endCharOfs);
    while ((match = wordRegex.exec(lineText)) !== null) {
      const name = match[0]
      const startWordOfs = line.startCharOfs + wordRegex.lastIndex - name.length;
      const endWordOfs   = wordRegex.lastIndex;
      words.push({name, startWordOfs, endWordOfs});;
    }
    line.words = words;
  }
  await addDefs(block);
}

async function addLines(block) {
  const location  = block.location;
  const document  = await vscode.workspace.openTextDocument(location.uri)
  const range     = block.location.range;
  const startLine = range.start.line;
  const endLine   = range.end.line;
  const lines = [];
  for(let lineNum = startLine; lineNum <= endLine; lineNum++) {
    const line = document.lineAt(lineNum);
    let startCharOfs = 0;
    let endCharOfs   = line.text.length;
    if(lineNum == 0)       startCharOfs = range.start.character;
    if(lineNum == endLine) endCharOfs   = range.end.character;
    line.startCharOfs = startCharOfs;
    line.endCharOfs   = endCharOfs;
    lines.push(line);
  };
  block.lines = lines;
}

async function addRefBlocks(block, fromRefId) {
  const blockId   = block.id;
  const blkAndIdx = navi.getBlockById(blockId);
  if(!blkAndIdx) return;
  let {blockIdx}  = blkAndIdx;
  try {
    const references = await vscode.commands.executeCommand(
      'vscode.executeReferenceProvider',
      block.location.uri,
      block.location.range.start
    );
    for(const reference of references) {
      // log(`Reference`, block.name, reference.uri, reference.range);
      const refBlock = 
        await getOrMakeBlock(block.name, reference.uri, reference.range);
      if(!refBlock) continue;
      if(reference.uri.path == block.location.uri.path &&
         reference.range.start.line == block.location.range.start.line) 
        continue;
      await navi.addBlockToView(refBlock, fromRefId, ++blockIdx);
    }
    await comm.send('scrollToBlkId', {blockId});
    // return references; 
  } catch (error) {
    log('err', 'Error getting references:', block.name, error.message);
  }
}

async function getOrMakeBlock(name, uri, range, srcSymbol) {
  const hash = JSON.stringify([name, uri.path, range]);
  const existingBlock = getBlockByHash(hash);
  if(existingBlock) return existingBlock;
  const id = html.getUniqueBlkId();
  const location = new vscode.Location(uri, range);
  const relPath  = vscode.workspace.asRelativePath(uri.path);
  const block = {id, name, location, relPath, hash};
  if(await utils.locationIsEntireFile(location))
    block.isEntireFile = true;
  await addLines(block);
  blockByHash[hash] = block;
  pathByBlkId[id]   = uri.path;
  if(srcSymbol === undefined) {
    const sel = new vscode.Selection(range.start, range.end);
    srcSymbol = await getSurroundingSymbol(uri, sel, name);
  }
  block.srcSymbol = srcSymbol;
  block.srcSymbol = block.srcSymbol ?? {name, range};
  block.location = new vscode.Location(uri, block.srcSymbol.range);
  // log('getOrMakeBlock, new block:', id, name);
  return block;
}

function getSymbols(selectionRange, symbols) {
  const parent = symbols[symbols.length - 1];
  for(const child of parent.children) {
    if(utils.containsRange(child.range, selectionRange)) {
      symbols.push(child);
      return getSymbols(selectionRange, symbols);
    }
  }
}

async function getSurroundingSymbol(uri, selectionRange, name) {
  try {
    const topSymbols = await vscode.commands.executeCommand(
                      'vscode.executeDocumentSymbolProvider', uri);
    if (!topSymbols || !topSymbols.length) {
      log('err', 'No topSymbols found.');
      return null;
    }
    const symbols = [{children: topSymbols}];
    getSymbols(selectionRange, symbols);
    symbols.shift();
    if (!symbols.length) {
      log('getSurroundingSymbol, No symbol found', {uri, selectionRange, name});
      return null;
    }
    if(symbols.length > 1 && 
      (symbols[symbols.length-1].name === 
       symbols[symbols.length-2].name)) {
      symbols.pop();
    }
    return symbols[symbols.length-1];;
  }
  catch (error) {
    log('err', 'getSurroundingSymbol error:', error.message);
    return null;
  }
}

async function getSurroundingBlock(uri, selectionRange) {
  const srcSymbol = await getSurroundingSymbol(uri, selectionRange, '');
  if(!srcSymbol) return null;
  const block = await getOrMakeBlock(
                    srcSymbol.name, uri, srcSymbol.range, srcSymbol);
  // log('getSurroundingBlock:', {id:block.id, name:block.name});
  return block;
}

let uniqueRefId = 1;

async function showFirstBlock(textEditor) {
  comm.send('startBusyInd', {});
  const document  = textEditor.document;
  const uri       = document.uri;
  const selection = textEditor.selection; 
  let block = await getSurroundingBlock(uri, selection);
  if(!block) {
    await utils.sleep(1000);
    block = await getSurroundingBlock(uri, selection);
    if(!block) {
      await navi.showEntireFileMsg(uri, -1);
      return;
    }
  }
  if(await utils.locationIsEntireFile(block.location)) {
    if(!(await navi.showEntireFileMsg(uri))) return;
  }
  await navi.addBlockToView(block);
}

async function showFirstBlockWhenReady(textEditor) {
  const langOk = html.setLanguage(textEditor);
  if(!langOk) return;
  html.setTheme();
  html.setColorPickerVal();
  html.setColorSelPickerVal();
  html.setFontSize();
  setIgnoreFilePatterns();
  navi.setEntireFileOk();
  await html.initWebviewHtml(textEditor);
  comm.registerWebviewRecv('ready', async () => {
    await showFirstBlock(textEditor);
  });
}

module.exports = { 
  init, showFirstBlockWhenReady, getBlocksByRefId, 
  getPathByBlkId, setPathByBlkId,
  addRefBlocks, removeBlockFromCaches, addWordsAndDefs
};
