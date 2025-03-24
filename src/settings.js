const vscode = require('vscode');
const utils  = require('./utils.js');
const log    = utils.getLog('SETT');

let config = null;

function init() {
  config = vscode.workspace.getConfiguration('definition-stack');
}

function dumpSettings() {
  const enabled = config.get('enableFeature', true); 
  const theme   = config.get('theme', 'light');
  const refreshInterval = config.get('refreshInterval', 5);
  const favoriteQuote   = config.get(
         'favoriteQuote', 'To be or not to be');
  log(`Favorite quote: ${favoriteQuote}, ` +
        `Enabled: ${enabled}, Theme: ${theme}, Interval: ${refreshInterval}`);
}

async function updateSettings() {
  await config.update('favoriteQuote', 'newQuote', vscode.ConfigurationTarget.Global);
  log(`Updated favorite quote to: ${'newQuote'}`);
  
  await config.update('refreshInterval', 10, vscode.ConfigurationTarget.Global);
}

vscode.workspace.onDidChangeConfiguration((event) => {
  if (event.affectsConfiguration('definition-stack.enableFeature')) 
    log('enableFeature changed');
  if (event.affectsConfiguration('definition-stack.theme')) 
    log('Theme setting changed');
  if (event.affectsConfiguration('definition-stack.refreshInterval')) 
    log('refreshInterval changed');
  if (event.affectsConfiguration('definition-stack.favoriteQuote')) 
    log('favoriteQuote changed');
  dumpSettings();
  // setTimeout(ensureLangMapInSettings, 2000);
});

function ensureLangMapInSettings() {
  vscode.commands.executeCommand('workbench.action.openSettingsJson').then(() => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const document = editor.document;
    const text = document.getText();
    const propertyName = 'definition-stack.languageMappings';
    const startPos = text.indexOf(propertyName);
    if(startPos !== -1) {
      const startPosition = document.positionAt(startPos); 
      const range = new vscode.Range(startPosition, startPosition);
      editor.revealRange(range);
      return;
    }
    // try {
    //   const json = JSON.parse(text);
    //   json[propertyName] = propertyValue;
    //   const updatedText = JSON.stringify(json, null, 2);
    //   editor.edit(editBuilder => {
    //     const fullRange = new vscode.Range(
    //       document.positionAt(0), 
    //       document.positionAt(text.length)
    //     );
    //     editBuilder.replace(fullRange, updatedText);
    //   }).then(() => {
    //     const startPos = updatedText.indexOf(propertyName);
    //     const startPosition = document.positionAt(startPos); 
    //     const endPos = startPosition.translate(0, propertyName.length); 
    //     const range = new vscode.Range(startPosition, endPos);
    //     editor.revealRange(range);
    //     editor.selection = new vscode.Selection(startPosition, endPos);
    //   });
    // } catch (error) {
    //   log('err', 'Failed to parse JSON:', error.message); 
    // }
  });
}

module.exports = { init, updateSettings };

/*
function activate(context) {
    // Register the command that modifies settings.json
    let disposable = vscode.commands.registerCommand('myExtension.myCommand', async function () {
        const config = vscode.workspace.getConfiguration();
        const settingKey = "myExtension.customSetting"; // Change this to your desired setting
        const settingValue = true; // Change to the value you want to set

        // Update settings.json
        await config.update(settingKey, settingValue, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(`Updated settings: ${settingKey} = ${settingValue}`);
    });

    context.subscriptions.push(disposable);

    // Listen for setting changes to trigger the command
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('myExtension.runButton')) {
            vscode.commands.executeCommand('myExtension.myCommand');
        }
    });
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};


{
  "contributes": {
    "commands": [
      {
        "command": "myExtension.myCommand",
        "title": "Run My Command"
      }
    ],
    "configuration": {
      "properties": {
        "myExtension.runButton": {
          "type": "string",
          "enum": ["Run Command"], 
          "enumDescriptions": ["Click to modify settings.json"], 
          "default": "Run Command",
          "description": "Press the button to modify settings.json.",
          "scope": "machine"
        },
        "myExtension.customSetting": {
          "type": "boolean",
          "default": false,
          "description": "This setting is modified by the button."
        }
      }
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
                                    : `"${key}": ${JSON.stringify(value)}`;
    return jsonString.slice(0, lastBraceIndex) 
                                + newProperty 
                                + jsonString.slice(lastBraceIndex);
}

// Example usage:
let jsonString = `{"name": "Alice", "age": 25}`;
jsonString = addPropertyToJsonString(jsonString, "city", "New York");
console.log(jsonString);
// Output: {"name": "Alice", "age": 25, "city": "New York"}

let emptyJsonString = `{}`;
emptyJsonString = addPropertyToJsonString(emptyJsonString, "city", "New York");
console.log(emptyJsonString);
// Output: {"city": "New York"}




*/