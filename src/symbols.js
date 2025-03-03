const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.log('symbols');

const reservedWords = require('reserved-words');
const isReservedWord = function(langId, word) {
  switch(langId) {
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

async function findSurroundingFunction(document, selection) {
  try {
    const docTopSymbols = await vscode.commands.executeCommand(
    'vscode.executeDocumentSymbolProvider', document.uri);
    if (!docTopSymbols) return {};

    const allFunctions = docTopSymbols
    .flatMap(symbol => getSymbolsRecursive(symbol))
    .filter(symbol => 
      symbol.kind === vscode.SymbolKind.Function || 
      symbol.kind === vscode.SymbolKind.Method
    );

    // Find the smallest containing function
    const containingFunctionSymbol = allFunctions
      .filter(func => utils.containsRange(func.range, selection))
      .sort((a, b) => utils.getRangeSize(a.range) 
                    - utils.getRangeSize(b.range))[0];
    if (containingFunctionSymbol) {
      const text = document.getText(containingFunctionSymbol.range);
      const location = containingFunctionSymbol.location;
      return {text, location};
    }
    return {};
  } 
  catch (error) {
    log('infoerr', error.message);
    return {};
  }
}

function findWordsInText(langId, text) {
  const regexString = 
          `\\b([\\w${langId == 'javascript' ? '$' : ''}]+)\\b`;
  const wordRegex = new RegExp(regexString, 'g');
  const words = [];
  let match;
  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[1];
    if (!isReservedWord(langId, word)) words.push(word);
  }
  return words;
}

async function getAllDocumentsWithLangid(langid) {
  const documents = [];
  const files = await vscode.workspace.findFiles('**/*');
  for(const file of files) {
    try {
      const doc = await vscode.workspace.openTextDocument(file);
      if(doc.languageId === langid) 
        documents.push(doc);
    }
    catch (_err) {}
  }
  return documents;
}

async function findSymRefsInDocument(document, words, funcLocation) {
  const allSymbols = await vscode.commands.executeCommand(
    'vscode.executeDocumentSymbolProvider', document.uri);
  if (!allSymbols) return [];
  const symRefs = [];
  for(const symbol of allSymbols) {
    if(!words.includes(symbol.name)) continue;
    const refs = [];
    const positionStart = new vscode.Position(
                                symbol.range.start.line, 
                                symbol.range.start.character);
    const allRefs = await vscode.commands.executeCommand(
        'vscode.executeReferenceProvider', 
          document.uri, positionStart);
    allRefs.forEach(refLocation => {
      if (utils.containsLocation(funcLocation, symbol.location)) return;
      if (utils.containsLocation(funcLocation, refLocation))
        refs.push(refLocation);
    });
    symRefs.push({symbol, refs});
  }
  return symRefs;
}

async function findSymRefsInFunction(document, selection) {
  const func = await findSurroundingFunction(document, selection);
  if(!func?.location) return [];
  const langId = document.languageId;
  const symRefs = [];
  const words = findWordsInText(langId, func.text);
  const docs  = await getAllDocumentsWithLangid(langId);
  for(const doc of docs) {
    const symRefsInDoc = 
            await findSymRefsInDocument(doc, words, func?.location)
    symRefs.push(...symRefsInDoc);
  }
  return symRefs;
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
