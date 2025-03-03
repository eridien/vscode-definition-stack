const vscode        = require('vscode');
const utils         = require('./utils.js');
const log           = utils.log('symbols');
const reservedWords = require('reserved-words');

const langExts = '**/*.{js,ts,py,java,cpp,c,cs,go,rs,php,rb,vue}';
const extToLangId         = {'vue': 'vue'}
const langsWithDollarSign = ['javascript', 'typescript', 'vue'];

const isReservedWord = function(langId, word) {
  switch(langId) {
    case 'javascript':
    case 'typescript':
    case 'vue':
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

async function findSurroundingFrame(document, selection) {
  try {
    const docTopSymbols = await vscode.commands.executeCommand(
    'vscode.executeDocumentSymbolProvider', document.uri);
    if (!docTopSymbols) return {};

    const allFrames = docTopSymbols
              .flatMap(symbol => getSymbolsRecursive(symbol))

    // Find the smallest containing symbol
    const containingFrameSymbol = allFrames
      .filter(frame => utils.containsRange(frame.range, selection))
      .sort((a, b) => utils.getRangeSize(a.range) 
                    - utils.getRangeSize(b.range))[0];
    if (containingFrameSymbol) {
      log({containingFrameSymbol});
      const text = document.getText(containingFrameSymbol.range);
      const location = containingFrameSymbol.location;
      return {text, location};
    }
    return {};
  } 
  catch (error) {
    log('infoerr', error.message);
    return {};
  }
}

function findWordsInText(langId, text, positionIn) {
  const lines = text.split('\n');
  const ds = langsWithDollarSign.includes(langId) ? '$' : '';
  const regexString = `\\b[a-zA-Z_${ds}][\\w${ds}]*?\\b`;
  const wordRegex = new RegExp(regexString, 'g');
  const wordAndPosArr = [];
  let match;
  while ((match = wordRegex.exec(text)) !== null) {
    const word = match[0];
    if (!isReservedWord(langId, word)) {
      let lineZeroCharOfs = positionIn.character;
      let charOfs = wordRegex.lastIndex - word.length;
      let lineOfs = 0;
      let position;
      for(const [lineNum, lineStr] of lines.entries()) {
        if(charOfs < (lineOfs + lineStr.length)) {
          const line = positionIn.line + lineNum;
          const char = lineZeroCharOfs + charOfs - lineOfs;
          position = new vscode.Position(line, char);
          break;
        }
        lineZeroCharOfs = 0;
        lineOfs += lineStr.length + 1;
      }
      const wordAndPos = {word, position};
      // log('word', wordAndPosArr.length, {wordAndPos});
      wordAndPosArr.push(wordAndPos);
    }
  }
  return wordAndPosArr;
}

async function getAllDocumentsWithLangid(langid) {
  const documents = [];
  const files = (await vscode.workspace.findFiles(langExts)).filter(
                    file => (!file.fsPath.includes('node_modules')));
  for(const file of files) {
    try {
      const doc = await vscode.workspace.openTextDocument(file);
      if(doc.languageId === langid) 
        documents.push(doc);
    }
    catch (err) {log('infoerr', err.message)}
  }
  return documents;
}

async function findSymRefsInDocument(document, words, frameLocation) {
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
      if (utils.containsLocation(frameLocation, symbol.location)) return;
      if (utils.containsLocation(frameLocation, refLocation))
        refs.push(refLocation);
    });
    if(refs.length > 0) symRefs.push({symbol, refs});
  }
  return symRefs;
}

async function findSymRefsInFrame(document, selection) {
  const frame = await findSurroundingFrame(document, selection);
  if(!frame?.location) return [];
  let langId;
  const ext = document.uri.path.split('.').slice(-1)[0];
  if(extToLangId[ext]) langId = extToLangId[ext];
  else                 langId = document.languageId;
  // const symRefs = [];
  const wordAndPosArr = 
      findWordsInText(langId, frame.text, frame.location.range.start);

  for(const wordAndPos of wordAndPosArr) {
    const def = await vscode.commands.executeCommand(
                 'vscode.executeDefinitionProvider',
                    document.uri, wordAndPos.position);
    if(def.length === 0) continue;
    const defLoc = new vscode.Location(
                          def[0].targetUri, def[0].targetRange);
    if(utils.containsLocation(frame.location, defLoc)) continue;
    // remove duplicates
    log(wordAndPos.word, def[0]);
  }

  // const words = wordAndPosArr.map(wordAndPos => wordAndPos.word);
  // const docs  = await getAllDocumentsWithLangid(langId);
  // for(const doc of docs) {
  //   const symRefsInDoc = 
  //           await findSymRefsInDocument(doc, words, frame.location)
  //   symRefs.push(...symRefsInDoc);
  // }
  // return symRefs;
}

module.exports = {findSymRefsInFrame };


/*
executeDefinitionProvider (VS Code's built-in Go to Definition).
Alternative: Use executeWorkspaceSymbolProvider to find symbols by name.

const vscode = require('vscode');

const symbolKinds = [
  ['File', 0],
  ['Module', 1],
  ['Namespace', 2],
  ['Package', 3],
  ['Class', 4],
  ['Method', 5],
  ['Property', 6],
  ['Field', 7],
  ['Constructor', 8],
  ['Enum', 9],
  ['Interface', 10],
  ['Frame', 11],
  ['Variable', 12],
  ['Constant', 13],
  ['String', 14],
  ['Number', 15],
  ['Boolean', 16],
  ['Array', 17],
  ['Object', 18],
  ['Key', 19],
  ['Null', 20],
  ['EnumMember', 21],
  ['Struct', 22],
  ['Event', 23],
  ['Operator', 24],
  ['TypeParameter', 25]
];

console.log(symbolKinds);


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
