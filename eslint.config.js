// const js = require("@eslint/js");

module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",  // Supports modern JavaScript
      sourceType: "commonjs"   // ✅ Enables CommonJS support
    },
    rules: {
      "no-console": "off",
      "no-undef": "error",      // Disallow using undefined variables
      "no-unused-vars": "warn"  // Warn about unused variables
    }
  }
];
