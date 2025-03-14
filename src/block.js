const vscode = require('vscode');
const html   = require('./html.js');
const comm   = require('./comm.js');
const utils  = require('./utils.js');
const log    = utils.getLog('PAGE');

const ignorePaths = ['node_modules', '.d.ts'];

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

function makeBlock(name, document, range) {
  const id        = 'blk-' + utils.getUniqueId();
  const projIdx   = utils.getProjectIdx(document);
  const projPath  = vscode.workspace.workspaceFolders[projIdx].uri.path;
  const relPath   = document.uri.path.slice(projPath.length+1);
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
  const location = new vscode.Location(document.uri, range);
  return {id, name, relPath, lines, location};
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

async function getSurroundingBlock(document, selectionRange) {
  try {
    const docTopSymbols = await vscode.commands.executeCommand(
             'vscode.executeDocumentSymbolProvider', document.uri);
    if (!docTopSymbols) return null;
    const allSymbols = docTopSymbols
              .flatMap(symbol => getSymbolsRecursive(symbol))
    // Find the smallest containing symbol
    const srcSymbol = allSymbols
      .filter(sym => utils.containsRange(sym.range, selectionRange))
      .sort((a,b) => utils.getRangeSize(a.range) - 
                     utils.getRangeSize(b.range))[0];
    if (srcSymbol)
      return makeBlock(srcSymbol.name, document, srcSymbol.range);
    return null;
  } 
  catch (error) {
    log('infoerr', error.message);
    return null;
  }
}

let defCount;

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
        const document = await vscode.workspace.openTextDocument(defUri);
        const location = new vscode.Location(defUri, defRange);
        if(utils.containsLocation(block.location, location)) continue;
        for(const ignorePath of ignorePaths) {
          if(defPath.includes(ignorePath)) continue defloop;
        }
        defCount++;
        const defBlock = makeBlock(name, document, defRange);
        word.defBlocks.push(defBlock);
      }
      if (word.defBlocks.length == 0) {
        delete words[idx];
        continue;
      }
      word.id = 'ref-' + utils.getUniqueId();
    }
    line.words = words.filter(word => word);
    html.highlightRefs(line, "background-color: #ff0;");
  }
}

async function buildPage(contextIn, textEditor) {
  context = contextIn;
  const document  = textEditor.document;
  const selection = textEditor.selection; 
  let block = await getSurroundingBlock(document, selection);
  if(!block) {
    await utils.sleep(2000);
    block = await getSurroundingBlock(document, selection);
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
  comm.clearRecvCallbacks();
  comm.registerWebviewRecv('ready', async () => {
    await buildPage(contextIn, textEditor);
  });
  html.setLanguage(textEditor);
  await html.initWebviewHtml(textEditor);
}

module.exports = { buildPageWhenReady };
