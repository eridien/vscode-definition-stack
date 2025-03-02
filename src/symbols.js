const vscode        = require('vscode');
const utils         = require('./utils.js');
const log           = utils.log('symbols');

const reservedWords = require('reserved-words');
const isReservedWord = function(document, word) {
  switch(document.languageId) {
    case 'javascript':
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


/*
**Find References** (vscode.executeReferenceProvider)
      Finds all references to the symbol under the cursor.

const references = await vscode.commands.executeCommand(
  'vscode.executeReferenceProvider',
  document.uri,
  position
)
*/

  for(const symbol of docTopSymbols) {
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

/*
**Document Symbols** (vscode.executeDocumentSymbolProvider)
      Lists all symbols in the current document.

const symbols = await vscode.commands.executeCommand(
  'vscode.executeDocumentSymbolProvider',
  document.uri
)
*/
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


/*
list of some common language IDs...
plaintext: Plain Text
abap: ABAP
bat: Batch
bibtex: BibTeX
clojure: Clojure
coffeescript: CoffeeScript
c: C
cpp: C++
csharp: C#
css: CSS
diff: Diff
dockerfile: Dockerfile
fsharp: F#
git-commit: Git Commit Message
git-rebase: Git Rebase Message
go: Go
groovy: Groovy
handlebars: Handlebars
html: HTML
ini: INI
java: Java
javascript: JavaScript
javascriptreact: JavaScript React (JSX)
json: JSON
jsonc: JSON with Comments
julia: Julia
latex: LaTeX
less: Less
lua: Lua
makefile: Makefile
markdown: Markdown
objective-c: Objective-C
objective-cpp: Objective-C++
perl: Perl
perl6: Perl 6
php: PHP
powershell: PowerShell
jade: Pug (formerly Jade)
python: Python
r: R
razor: Razor (cshtml)
ruby: Ruby
rust: Rust
scss: SCSS
sass: Sass
shaderlab: ShaderLab
shellscript: Shell Script (Bash)
sql: SQL
swift: Swift
typescript: TypeScript
typescriptreact: TypeScript React (TSX)
tex: TeX
vb: Visual Basic
xml: XML
xsl: XSL
yaml: YAML

**Go to Definition** (vscode.executeDefinitionProvider)
      Navigates to the definition of the symbol under the cursor.

const definition = await vscode.commands.executeCommand(
  'vscode.executeDefinitionProvider',
  document.uri,
  position
)

**Find References** (vscode.executeReferenceProvider)
      Finds all references to the symbol under the cursor.

const references = await vscode.commands.executeCommand(
  'vscode.executeReferenceProvider',
  document.uri,
  position
)
     
**Document Symbols** (vscode.executeDocumentSymbolProvider)
      Lists all symbols in the current document.

const symbols = await vscode.commands.executeCommand(
  'vscode.executeDocumentSymbolProvider',
  document.uri
)
     
**Workspace Symbols** (vscode.executeWorkspaceSymbolProvider)
      Searches for symbols across the entire workspace.

const symbols = await vscode.commands.executeCommand(
  'vscode.executeWorkspaceSymbolProvider',
  'searchQuery'
)
*/
