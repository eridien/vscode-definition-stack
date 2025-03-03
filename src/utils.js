/*
  options:
    include node_modules
*/

const vscode = require('vscode');

const outputChannel = 
         vscode.window.createOutputChannel('Definition Stack');
outputChannel.clear();
outputChannel.show(true);

function log(module) {
  const log = function(...args) {
    const errFlag    = (typeof args[0] == 'string' && args[0].includes('err'));
    const infoFlag   = (typeof args[0] == 'string' && args[0].includes('nomod'));
    const moduleFlag = (typeof args[0] == 'string' && args[0].includes('info'));
    if(errFlag || infoFlag) args = args.slice(1);
    const par = args.map(a => 
      typeof a === 'object' ? JSON.stringify(a, null, 2) : a);
    const line = (moduleFlag ? '' : module + ':') + 
                 (errFlag    ? ' ERROR, ' : '') + par.join(' ')
    outputChannel.appendLine(line);
    if(errFlag) console.error(line);
    else        console.log(line);
    if(infoFlag) vscode.window.showInformationMessage(line);
  }
  return log;
}

function containsRange(outerRange, innerRange) {
  if((innerRange.start.line < outerRange.start.line) ||
     (innerRange.end.line   > outerRange.end.line)) 
    return false;
  if((innerRange.start.line == outerRange.start.line) &&
     (innerRange.start.character < outerRange.start.character))
    return false;
  if((innerRange.end.line == outerRange.end.line) &&
     (innerRange.end.character > outerRange.end.character))
    return false;
  return true;
}

function containsLocation(outerLocation, innerLocation) {
  if(outerLocation.uri.toString() !== 
     innerLocation.uri.toString()) return false;
  return containsRange(outerLocation.range, innerLocation.range);
}

function getRangeSize(range) {
  return range.end.line - range.start.line;
}

module.exports = { log, containsRange, containsLocation, getRangeSize };
