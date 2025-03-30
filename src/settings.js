const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('SETT');

let config = null;

function init() {
  config = vscode.workspace.getConfiguration('definition-stack');
}

const settingCallbacks = {};

const settings = [
  'ignoreFilePatterns', // patterns for files to ignore
  'languageIdMappings', // mappings from vscode language IDs to extension IDs
  'entireFileOk'    ,   // definitions that occupy an entire file should be shown
]

function logSettings() {
  for(const setting in settings) {
    if(settingCallbacks.hasOwnProperty(setting)) {
      log(`setting ${setting}: ${settings[setting]}`);
    }
  }
}

async function updateSetting(name, value) {
  await config.update(name, value, vscode.ConfigurationTarget.Global);
  log(`updated setting ${name} to ${value}`);
}

function registerSettingCallback(settingName, callback) {
  settingCallbacks[settingName] = callback;
}

vscode.workspace.onDidChangeConfiguration((event) => {
  for(const setting of settings) {
    const settingName = `definition-stack.${setting}`;
    if (event.affectsConfiguration(settingName)) {
      const value = vscode.workspace.getConfiguration().get(settingName);
      let prtValue = value;
      if(typeof value === 'object')
        prtValue = JSON.stringify(value, null, 2);
      log(`setting ${setting} changed to: ${prtValue}`);
      if(settingCallbacks[setting]) settingCallbacks[setting](value);
    }
  }
})

module.exports = { init, logSettings, updateSetting, registerSettingCallback };
