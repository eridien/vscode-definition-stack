
// keep-esc is a teensie-weensie plugin to escape HTML 
// entities in Prism.js.
// This is needed because Prism undoes escaping.

/* run this on your html before inserting it into the DOM

function charsToMrkrs(str) {
  return str.replaceAll(/&/g, "\u0001")
            .replaceAll(/</g, "\u0002")
            .replaceAll(/>/g, "\u0003")
            .replaceAll(/"/g, "\u0004");
}
*/

Prism.hooks.add('before-insert', function (env) {
  env.highlightedCode = env.highlightedCode 
      .replaceAll("\u0001", "&amp;amp;" )
      .replaceAll("\u0002", "&amp;lt;"  )
      .replaceAll("\u0003", "&amp;gt;"  );
});

