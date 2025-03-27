const vscode = require('vscode');
const navi   = require('./navigate.js');
const html   = require('./html.js');
const comm   = require('./comm.js');
const utils  = require('./utils.js');
const log    = utils.getLog('BLCK');

const ignorePaths = ['node_modules', '.d.ts'];

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

async function addDefs(block) {
  const blockUri = block.location.uri;
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
        const defRange = definition.targetRange;
        if(defRange.start.line      == defRange.end.line  &&
           defRange.start.character == defRange.end.character) 
          continue defloop;
        const defUri   = definition.targetUri;
        const defPath  = defUri.path;
        const location = new vscode.Location(defUri, defRange);
        if(block.location.range.start.line == defRange.start.line &&
           block.location.range.end.line   == defRange.end.line) continue;
        if(utils.containsLocation(block.location, location)) continue;
        for(const ignorePath of ignorePaths) {
          if(defPath.includes(ignorePath)) continue defloop;
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
    for(const word of words) {
      const blocks = [];
      for(const defBlock of word.defBlocks) {
        blocks.push(defBlock);
      }
      blocksByRefId[word.id] = blocks;
    }
    html.markupRefs(line);
  }
}

async function addWordsAndDefs(block) {
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
  let {blockIdx}    = blkAndIdx;
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
      await addWordsAndDefs(refBlock);
      await navi.addBlockToView(refBlock, fromRefId, ++blockIdx);
    }
    await comm.send('scrollToBlkId', {blockId});
    // return references; 
  } catch (error) {
    log('err', 'Error getting references:', block.name, error.message);
  }
}

let uniqueBlkId = 1;

async function getOrMakeBlock(name, uri, range) {
  // log({name, uri, range});
  const hash = JSON.stringify([name, uri.path, range]);
  const existingBlock = getBlockByHash(hash);
  if(existingBlock) return existingBlock;
  const id = `ds-blk-${uniqueBlkId++}`;
  const location = new vscode.Location(uri, range);
  const document = await vscode.workspace.openTextDocument(uri)
  const projIdx  = utils.getProjectIdx(document);
  const projPath = vscode.workspace.workspaceFolders[projIdx].uri.path;
  const relPath  = uri.path.slice(projPath.length+1);
  
  const block = {id, name, location, relPath, hash};
  if(await utils.locationIsEntireFile(location))
    block.isEntireFile = true;
  await addLines(block);
  blockByHash[hash] = block;
  pathByBlkId[id]   = uri.path;
  const sel = new vscode.Selection(range.start, range.end);
  block.srcSymbol = await getSurroundingBlock(uri, sel, true);
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

async function getSurroundingBlock(uri, selectionRange, symbolOnly = false) {
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
    console.log('symbols', symbols);
    if (!symbols.length) {
      log('infoerr', 'No symbol found.');
      return null;
    }
    if(symbols.length > 1 && 
      (symbols[symbols.length-1].name === 
       symbols[symbols.length-2].name)) {
      symbols.pop();
    }
    const srcSymbol = symbols[symbols.length-1];
    if(symbolOnly) return srcSymbol;
    const block = await getOrMakeBlock(srcSymbol.name, uri, srcSymbol.range);
    log('getSurroundingBlock:', {id:block.id, name:block.name});
    return block;
  }
  catch (error) {
    log('err', 'getSurroundingBlock error:', error.message);
    return null;
  }
}

let uniqueRefId = 1;

async function showFirstBlock(textEditor) {
  const document  = textEditor.document;
  const uri       = document.uri;
  const selection = textEditor.selection; 
  let block = await getSurroundingBlock(uri, selection);
  if(!block) {
    await utils.sleep(2000);
    block = await getSurroundingBlock(uri, selection);
    if(!block) {
      html.showInWebview('Definition is an entire file and hidden. See settings.');
      return;
    }
  }
  if(await utils.locationIsEntireFile(block.location)) {
    html.showInWebview('Definition is an entire file and hidden. See settings.');
    return;
  }
  await addWordsAndDefs(block);
  await navi.addBlockToView(block);
}

async function showFirstBlockWhenReady(textEditor) {
  comm.registerWebviewRecv('ready', async () => {
    log('webview ready');
    await showFirstBlock(textEditor);
  });
  html.setTheme();
  html.setLanguage(textEditor);
  await html.initWebviewHtml(textEditor);
}

module.exports = { 
  init, showFirstBlockWhenReady, getBlocksByRefId, getPathByBlkId,
  addRefBlocks, removeBlockFromCaches, addWordsAndDefs
};
