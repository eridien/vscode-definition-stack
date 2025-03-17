// console.log('loading block module');

const vscode = require('vscode');
const navi   = require('./navigate.js');
const html   = require('./html.js');
const comm   = require('./comm.js');
const utils  = require('./utils.js');
const log    = utils.getLog('BLCK');

const ignorePaths = ['node_modules', '.d.ts'];

let blockByHash   = {};
let blocksByRefId = {};

function init() {
  blockByHash   = {};
  blocksByRefId = {};
}

function getBlockByHash(hash) {
  return blockByHash[hash];
}

function getBlocksByRefId(refId) {
  return blocksByRefId[refId];
}

function showAllBlocks() {
  for(const block of Object.values(blockByHash)) {
    const {id, name} = block;
    log(id, name);
  };
}

function showAllRefs() {
  for(const [refId, blocks] of Object.entries(blocksByRefId)) {
    let blocksStr = '';
    for(const block of blocks) 
      blocksStr += `${block.id }:${block.name}, `;
    log(refId, blocksStr.slice(0, -2));
  };
}

function addWords(block) {
  if(block.flags.haveWords) return;
  block.flags.haveWords = true;
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
}

async function addLines(block) {
  if(block.flags.haveLines) return;
  block.flags.haveLines = true;
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

async function addDefs(block) {
  if(block.flags.haveDefs) return;
  block.flags.haveDefs = true;
  const blockUri = block.location.uri;
  for(const line of block.lines) {
    let words = line.words;
    for(let idx = 0; idx < words.length; idx++) {
      const word = words[idx];
      const name = word.name;
      const startWordPos = 
              new vscode.Position(line.lineNumber, word.startWordOfs);
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
      word.id = `ds-ref-${uniqueRefId++}`;
    }
    words = words.filter(word => word);
    line.words = words;
    for(const word of words) {
      const blocks = [];
      for(const defBlock of word.defBlocks) {
        blocks.push(defBlock);
      }

      const blk0 = blocks[0];
      if(blk0                                    && 
         blk0.location.range.end.line      == 0  &&
         blk0.location.range.end.character == 0) 
        debugger;

      blocksByRefId[word.id] = blocks;
    }
    html.markupRefs(line);
  }
}

async function addAllData(block) {
  await addLines(block);
  addWords(block);
  await addDefs(block);
}

let uniqueBlkId = 1;

async function getOrMakeBlock(name, uri, range) {
  const hash = JSON.stringify([name, uri.path, range]);
  const existingBlock = getBlockByHash(hash);
  if(existingBlock) return existingBlock;
  const id = `ds-blk-${uniqueBlkId++}`;
  const location = new vscode.Location(uri, range);
  const document = await vscode.workspace.openTextDocument(location.uri)
  const projIdx  = utils.getProjectIdx(document);
  const projPath = vscode.workspace.workspaceFolders[projIdx].uri.path;
  const relPath  = uri.path.slice(projPath.length+1);
  const block = {id, name, location, relPath, hash};
  block.flags = {};
  block.flags.isEntireFile = 
        await utils.locationIsEntireFile(location);
  await addLines(block);
  blockByHash[hash] = block;
  if(!block.srcSymbol) {
    const sel = new vscode.Selection(range.start, range.end);
    block.srcSymbol = await getSurroundingBlock(uri, sel, true);
  }
  block.srcSymbol = block.srcSymbol || {name, range};
  // log('getOrMakeBlock, new block:', id, name);
  return block;
}

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

async function getSurroundingBlock(uri, selectionRange, symbolOnly = false) {
  try {
    const docTopSymbols = await vscode.commands.executeCommand(
             'vscode.executeDocumentSymbolProvider', uri);
    if (!docTopSymbols) return null;
    const allSymbols = docTopSymbols
              .flatMap(symbol => getSymbolsRecursive(symbol))
    // Find the smallest containing symbol
    const srcSymbol = allSymbols
      .filter(sym => utils.containsRange(sym.range, selectionRange))
      .sort((a,b) => utils.getRangeSize(a.range) - 
                     utils.getRangeSize(b.range))[0];
    if(symbolOnly) return srcSymbol;
    if (srcSymbol) {
      const block = await getOrMakeBlock(
                              srcSymbol.name, uri, srcSymbol.range);
      block.srcSymbol = srcSymbol;
      return block;
    }
    return null;
  }
  catch (error) {
    log('infoerr', error.message);
    return null;
  }
}

let uniqueRefId = 1;

async function showFirstBlock(contextIn, textEditor) {
  context = contextIn;
  const document  = textEditor.document;
  const uri       = document.uri;
  const selection = textEditor.selection; 
  let block = await getSurroundingBlock(uri, selection);
  if(!block) {
    await utils.sleep(2000);
    block = await getSurroundingBlock(uri, selection);
    if(!block) {
      html.showInWebview('The selection is not in a block.');
      return;
    }
  }
  block.flags.isRoot = true;
  if(await utils.locationIsEntireFile(block.location)) {
    html.showInWebview('Selection is the entire file. Select a smaller block.');
    return;
  }
  await addAllData(block, false);
  await navi.addBlockToView(block);
}

async function showFirstBlockWhenReady(contextIn, textEditor) {
  comm.registerWebviewRecv('ready', true, async () => {
    log('webview ready');
    await showFirstBlock(contextIn, textEditor);
  });
  html.setLanguage(textEditor);
  await html.initWebviewHtml(textEditor);
}

module.exports = { 
  init, showFirstBlockWhenReady, getBlocksByRefId, 
  showAllBlocks, showAllRefs, addAllData
};
