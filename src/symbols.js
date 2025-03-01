const vscode = require('vscode');

async function findSurroundingFunction(
                    document, selection) {
  try {
    const symbols = await vscode.commands.executeCommand(
      'vscode.executeDocumentSymbolProvider',
      document.uri
    );

    if (!symbols) return { range: selection };

    const allFunctions = symbols.flatMap(symbol => 
      getFunctionSymbols(symbol)
    ).filter(symbol => 
      symbol.kind === vscode.SymbolKind.Function || 
      symbol.kind === vscode.SymbolKind.Method
    );

    // Find the smallest containing function
    const containingFunction = allFunctions
      .filter(func => containsRange(func.range, selection))
      .sort((a, b) => getRangeSize(a.range) 
        - getRangeSize(b.range))[0];

    if (containingFunction) {
      return {
        name: containingFunction.name,
        source: document.getText(containingFunction.range),
        range: containingFunction.range
      };
    }
    return { range: selection };
  } catch (error) {
    console.error(
        'Error finding surrounding function:', error);
    return { range: selection };
  }
}

function getFunctionSymbols(symbol) {
  const functions = [];
  if (symbol.kind === vscode.SymbolKind.Function || 
      symbol.kind === vscode.SymbolKind.Method) {
    functions.push(symbol);
  }
  if (symbol.children) {
    symbol.children.forEach(child => {
      functions.push(...getFunctionSymbols(child));
    });
  }
  return functions;
}

function containsRange(outer, inner) {
  return outer.start.isBefore(inner.start) && 
         outer.end.isAfter(inner.end);
}

function getRangeSize(range) {
  return range.end.line - range.start.line;
}

async function findSymbolsInRange(document, range) {
  try {
    const symbols = await vscode.commands.executeCommand(
      'vscode.executeDocumentSymbolProvider',
      document.uri
    );

    if (!symbols) return [];

    const allSymbols = symbols.flatMap(symbol => 
      getAllSymbols(symbol)
    );

    return allSymbols
      .filter(symbol => {
        const symbolRange = symbol.range;
        return !containsRange(range, symbolRange);
      })
      .map(symbol => ({
        name: symbol.name,
        kind: symbol.kind,
        range: symbol.range
      }));
  } catch (error) {
    console.error(
        'Error finding symbols in range:', error);
    return [];
  }
}

function getAllSymbols(symbol) {
  const symbols = [symbol];
  if (symbol.children) {
    symbol.children.forEach(child => {
      symbols.push(...getAllSymbols(child));
    });
  }
  return symbols;
}

async function findSymbolsInSurroundingFunction(document, selection) {
  const functionInfo = await findSurroundingFunction(document, selection);
  const symbols = await findSymbolsInRange(document, functionInfo.range);
  return {
    ...functionInfo,
    symbols
  };
}

module.exports = { 
  findSymbolsInSurroundingFunction 
};
