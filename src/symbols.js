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
        range: containingFunction.range,
        symbol: containingFunction,
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

function getAllNestedSymbols(symbol) {
  const symbols = [];
  if (symbol.children) {
    symbol.children.forEach(child => {
      symbols.push(child);
      symbols.push(...getAllNestedSymbols(child));
    });
  }
  return symbols;
}

function isRangeWithin(outer, inner) {
  return (
    (inner.start.line > outer.start.line || 
     (inner.start.line === outer.start.line && 
      inner.start.character >= outer.start.character)) &&
    (inner.end.line < outer.end.line || 
     (inner.end.line === outer.end.line && 
      inner.end.character <= outer.end.character))
  );
}

async function findSymbolsInRange(document, range) {
  try {
    // Get all defined symbols first
    const symbols = await vscode.commands.executeCommand(
      'vscode.executeDocumentSymbolProvider',
      document.uri
    );

    // Get all references in the document
    const allReferences = await Promise.all(
      (symbols || []).map(async symbol => {
        const symRange = new vscode.Range(
          symbol.range.start.line, 
          symbol.range.start.character,
          symbol.range.start.line, 
          symbol.range.start.character + symbol.name.length
        );
        const refs = await vscode.commands.executeCommand(
          'vscode.executeReferenceProvider',
          document.uri,
          symRange.start
        ) || [];
        return { symbol, references: refs };
      })
    );

    // Get definitions and references within our range
    const symbolsInRange = new Set();
    
    // Add defined symbols in range
    const definedSymbols = (symbols || [])
      .flatMap(symbol => getAllSymbols(symbol))
      .filter(symbol => isRangeWithin(range, symbol.range));
    
    definedSymbols.forEach(s => symbolsInRange.add(s));

    // Add references in range
    allReferences.forEach(({ symbol, references }) => {
      references.forEach(ref => {
        if (isRangeWithin(range, ref.range)) {
          symbolsInRange.add({
            name: symbol.name,
            kind: symbol.kind,
            range: ref.range,
            isReference: true
          });
        }
      });
    });

    return Array.from(symbolsInRange).map(symbol => ({
      name: symbol.name,
      kind: symbol.kind,
      range: symbol.range,
      isReference: symbol.isReference || false
    }));
  } catch (error) {
    console.error('Error finding symbols in range:', error);
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

async function findSymbolsInFunction(document, selection) {
  const funcInfo = await findSurroundingFunction(document, selection);
  if (!funcInfo.symbol) return { ...funcInfo, symbols: [] };

  // Get symbols from both approaches
  const nestedSymbols = getAllNestedSymbols(funcInfo.symbol);
  const rangeSymbols = await findSymbolsInRange(document, funcInfo.range);

  // Combine and deduplicate symbols
  const allSymbols = [...nestedSymbols, ...rangeSymbols]
    .filter((symbol, index, self) => 
      index === self.findIndex(s => 
        s.name === symbol.name && 
        s.range.start.line === symbol.range.start.line
      )
    )
    .map(symbol => ({
      name: symbol.name,
      kind: symbol.kind,
      range: symbol.range
    }));

  return {
    ...funcInfo,
    symbols: allSymbols
  };
}

module.exports = { 
  findSymbolsInFunction 
};
