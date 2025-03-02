const vscode = require('vscode');

const outputChannel = 
         vscode.window.createOutputChannel('Definition Stack');
outputChannel.clear();
outputChannel.show(true);

function log(module) {
  const log = function(...args) {
    const errFlag  = args[0].includes('err');
    const infoFlag = args[0].includes('info');
    if(errFlag || infoFlag) args = args.slice(1);
    const par = args.map(a => 
      typeof a === 'object' ? JSON.stringify(a, null, 2) : a);
    const line = module + (errFlag ? ' ERROR: ' : ': ') 
                        + par.join(' ')
    outputChannel.appendLine(line);
    if(errFlag) console.error(line);
    else        console.log(line);
    if(infoFlag) vscode.window.showInformationMessage(line);
  }
  return log;
}

function containsRange(outerRange, innerRange) {
  return outerRange.start.isBefore(innerRange.start) && 
         outerRange.end.isAfter(innerRange.end);
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
