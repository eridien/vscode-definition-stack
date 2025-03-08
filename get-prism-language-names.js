// node get-prism-language-names.js

const fs = require('fs');
const prismPath = '/Users/mark/apps/prism/components';

const prismComponents = fs.readdirSync(prismPath);
for(const prismComponent of prismComponents) {
  const match = /^prism-([^\.]*?)\.js$/.exec(prismComponent);
  if (!match) continue;
  const componentName = match[1];
  fs.appendFileSync('prism-languages.txt', componentName + `\n`);
}
