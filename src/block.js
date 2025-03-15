const vscode = require('vscode');
const html   = require('./html.js');
const comm   = require('./comm.js');
const utils  = require('./utils.js');
const log    = utils.getLog('BLCK');

const ignorePaths = ['node_modules', '.d.ts'];

const blockByHash   = {};
const blocksByRefId = {};

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

function addPossibleWords(block) {
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

async function addDefBlocks(block) {
  const blockUri = block.location.uri;
  for(const line of block.lines) {
    const words = line.words;
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
        const defUri   = definition.targetUri;
        const defRange = definition.targetRange;
        const defPath  = defUri.path;
        const location = new vscode.Location(defUri, defRange);
        if(utils.containsLocation(block.location, location)) continue;
        for(const ignorePath of ignorePaths) {
          if(defPath.includes(ignorePath)) continue defloop;
        }
        defCount++;
        const defBlock = await getOrMakeBlock(name, defUri, defRange);
        word.defBlocks.push(defBlock);
      }
      if (word.defBlocks.length == 0) {
        delete words[idx];
        continue;
      }
      word.id = `ds-ref-${uniqueRefId++}`;
    }
    line.words = words.filter(word => word);
    for(const word of line.words) {
      const blocks = [];
      for(const defBlock of word.defBlocks) {
        blocks.push(defBlock);
      }
      blocksByRefId[word.id] = blocks;
    }
    html.markupRefs(line, "background-color: #ff0;");
  }
}

let uniqueBlkId = 1;

async function getOrMakeBlock(name, uri, range) {
  const hash = JSON.stringify([name, uri.path, range]);
  // log('getOrMakeBlock, hash:', hash);
  const existingBlock = blockByHash[hash];
  if(existingBlock) { 
    // log('getOrMakeBlock, using existing block:', existingBlock.id, name);
    return existingBlock;
  }
  const id = `ds-blk-${uniqueBlkId++}`;
  const location = new vscode.Location(uri, range);
  const document = await vscode.workspace.openTextDocument(location.uri)
  const projIdx  = utils.getProjectIdx(document);
  const projPath = vscode.workspace.workspaceFolders[projIdx].uri.path;
  const relPath  = uri.path.slice(projPath.length+1);
  const block = {id, name, location, relPath, hash};
  await addLines(block);
  blockByHash[hash] = block;
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

async function getSurroundingBlock(uri, selectionRange) {
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
    if (srcSymbol)
      return getOrMakeBlock(srcSymbol.name, uri, srcSymbol.range);
    return null;
  }
  catch (error) {
    log('infoerr', error.message);
    return null;
  }
}

let defCount;
let uniqueRefId = 1;

async function buildPage(contextIn, textEditor) {
  context = contextIn;
  const document  = textEditor.document;
  const uri       = document.uri;
  const selection = textEditor.selection; 
  let block = await getSurroundingBlock(uri, selection);
  if(!block) {
    await utils.sleep(2000);
    block = await getSurroundingBlock(uri, selection);
    if(!block) {
      html.showMsgInPage('The selection is not in a block.');
      return;
    }
  }
  addPossibleWords(block);
  defCount  = 0;
  await addDefBlocks(block);
  if(defCount == 0) {
    html.showMsgInPage(`Found no symbol in selection with a definition.`);
    return;
  }
  await html.addBlockToView(block);
}

async function buildPageWhenReady(contextIn, textEditor) {
  comm.registerWebviewRecv('ready', true, async () => {
    await buildPage(contextIn, textEditor);
  });
  html.setLanguage(textEditor);
  await html.initWebviewHtml(textEditor);
}

module.exports = { 
  buildPageWhenReady, addDefBlocks, addLines, addPossibleWords,
  showAllBlocks, showAllRefs, getBlocksByRefId 
};
