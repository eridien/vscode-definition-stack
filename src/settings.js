const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('SETT');

let config = null;

function init() {
  config = vscode.workspace.getConfiguration('definition-stack');
}

const settingCallbacks = {};

const settings = {
  ignorePatterns: ['node_modules'], // strings for file patterns to ignore
  mappings:       {},  // mappings from vscode language IDs to extension IDs
  entireFileOk: true,  // definitions that occupy an entire file should be shown
  maxLines:       0,   // max number of lines in a block (0 means no limit)
  size:          1.0   // text size multiplier for display
}

function logSettings() {
  for(const setting in settings) {
    if(settingCallbacks.hasOwnProperty(setting)) {
      log(`setting ${setting}: ${settings[setting]}`);
    }
  }
}

function addPropertyToJsonString(jsonString, key, value) {
  jsonString = jsonString.trim();
  if (jsonString === "{}")
      return `{"${key}": ${JSON.stringify(value)}}`;
  let lastBraceIndex = jsonString.lastIndexOf("}");
  if (lastBraceIndex === -1) return jsonString;
  let hasProperties = jsonString.lastIndexOf("{") < lastBraceIndex - 1;
  let newProperty = hasProperties ? `, "${key}": ${JSON.stringify(value)}` 
                                  : `"${key}":   ${JSON.stringify(value)}`;
  return jsonString.slice(0, lastBraceIndex) + newProperty 
                              + jsonString.slice(lastBraceIndex);
}

async function updateSetting(name, value) {
  await config.update(name, value, vscode.ConfigurationTarget.Global);
  log(`updated setting ${name} to ${value}`);
}

function registerSettingCallback(settingName, callback) {
  settingCallbacks[settingName] = callback;
}

for(const setting in settings) {
  vscode.workspace.onDidChangeConfiguration((event) => {
    log(`setting ${setting} changed`);
    if(settingCallbacks[setting]) settingCallbacks[setting](event);
  }
}

module.exports = { init, logSettings, updateSetting, registerSettingCallback }
