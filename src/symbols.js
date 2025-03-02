const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.log('symbols');

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
async function findSurroundingFunction(
                  document, docTopSymbols, selection) {
  try {
    const allFunctions = docTopSymbols
    .flatMap(symbol => getSymbolsRecursive(symbol))
    .filter(symbol => 
      symbol.kind === vscode.SymbolKind.Function || 
      symbol.kind === vscode.SymbolKind.Method
    );

    // Find the smallest containing function
    const containingFunction = allFunctions
      .filter(func => utils.containsRange(func.range, selection))
      .sort((a, b) => utils.getRangeSize(a.range) 
                    - utils.getRangeSize(b.range))[0];
    if (containingFunction) {
      return {
        source: document.getText(containingFunction.range),
        symbol: containingFunction,
      };
    }
    return {};
  } 
  catch (error) {
    log('infoerr', error);
    return {};
  }
}

async function findSymRefsInRange(document, docTopSymbols, rangeIn) {
  const locationIn = new vscode.Location(document.uri, rangeIn);
  const symRefsInRange = [];
  for(const symbol of docTopSymbols) {



    // should inner symbols be used?
    // msg in onopen is an example
    // could they be assigned to an outer variable?


    const symbols = getSymbolsRecursive(symbol);
    for(const symbol of symbols) {
      const positionStart = new vscode.Position(
                                  symbol.range.start.line, 
                                  symbol.range.start.character);
      const refs = await vscode.commands.executeCommand(
          'vscode.executeReferenceProvider', 
           document.uri, positionStart);
      refs.forEach(refLocation => {
        if (utils.containsLocation(locationIn, symbol.location)) return;
        if (utils.containsLocation(locationIn, refLocation)) {
          const symRef = {symbol, refLocation};
          symRefsInRange.push(symRef);
        }
      });
    }
  }
  return symRefsInRange;
}

async function findSymRefsInFunction(document, selection) {
  const docTopSymbols = await vscode.commands.executeCommand(
    'vscode.executeDocumentSymbolProvider', document.uri);
  if (!docTopSymbols) return [];
  const func = await findSurroundingFunction(
                      document, docTopSymbols, selection);
  if(!func?.symbol) return [];
  const funcRefs = await findSymRefsInRange(
                      document, docTopSymbols, func.symbol.range);
  return funcRefs;
}

module.exports = {findSymRefsInFunction };
