function iconDiv(name, btnId, style) {
  const styleStr = style ? `style="${style}"` : '';
  return `<div id="${btnId}-icon-${name}" class="hover button" ${styleStr}>`
};

function iconHtml(name, btnId, style) {
  switch(name) {
    case 'close-border': return iconDiv(name, btnId, style) + `
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M464 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm0 394c0 3.3-2.7 6-6 6H54c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h404c3.3 0 6 2.7 6 6v340zM356.5 194.6L295.1 256l61.4 61.4c4.6 4.6 4.6 12.1 0 16.8l-22.3 22.3c-4.6 4.6-12.1 4.6-16.8 0L256 295.1l-61.4 61.4c-4.6 4.6-12.1 4.6-16.8 0l-22.3-22.3c-4.6-4.6-4.6-12.1 0-16.8l61.4-61.4-61.4-61.4c-4.6-4.6-4.6-12.1 0-16.8l22.3-22.3c4.6-4.6 12.1-4.6 16.8 0l61.4 61.4 61.4-61.4c4.6-4.6 12.1-4.6 16.8 0l22.3 22.3c4.7 4.6 4.7 12.1 0 16.8z"/></svg></div>`;

    case 'delete': return iconDiv(name, btnId, style) + `
        <?xml version="1.0" ?><!DOCTYPE svg  PUBLIC '-//W3C//DTD SVG 1.1//EN'  'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'><svg viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M437.5,386.6L306.9,256l130.6-130.6c14.1-14.1,14.1-36.8,0-50.9c-14.1-14.1-36.8-14.1-50.9,0L256,205.1L125.4,74.5  c-14.1-14.1-36.8-14.1-50.9,0c-14.1,14.1-14.1,36.8,0,50.9L205.1,256L74.5,386.6c-14.1,14.1-14.1,36.8,0,50.9  c14.1,14.1,36.8,14.1,50.9,0L256,306.9l130.6,130.6c14.1,14.1,36.8,14.1,50.9,0C451.5,423.4,451.5,400.6,437.5,386.6z"/></svg></div>`;

    case 'collapse': return iconDiv(name, btnId, style) + `
        <?xml version="1.0" ?><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="12 7.59 7.05 2.64 5.64 4.05 12 10.41 18.36 4.05 16.95 2.64 12 7.59"/><polygon points="5.64 19.95 7.05 21.36 12 16.41 16.95 21.36 18.36 19.95 12 13.59 5.64 19.95"/></svg></div>`;

    case 'expand': return iconDiv(name, btnId, style) + `
        <?xml version="1.0" ?><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="12 19.24 7.05 14.29 5.64 15.71 12 22.07 18.36 15.71 16.95 14.29 12 19.24"/><polygon points="5.64 8.29 7.05 9.71 12 4.76 16.95 9.71 18.36 8.29 12 1.93 5.64 8.29"/></svg></div>`;

 case 'up-ptr': return iconDiv(name, btnId, style) + `
        <?xml version="1.0" ?><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><polygon points="396.6,352 416,331.3 256,160 96,331.3 115.3,352 256,201.5 "/></svg></div>`;

 case 'down-ptr': return iconDiv(name, btnId, style) + `
        <?xml version="1.0" ?><svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><rect fill="none" height="256" width="256"/><polyline fill="none" points="208 96 128 176 48 96" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg></div>`;

 case 'home': return iconDiv(name, btnId, style) + `
        <?xml version="1.0" ?><svg viewBox="-1 0 26 26" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg"><defs id="defs2"/><g id="g1265" style="display:inline" transform="translate(-1.0999855e-7,-290.64998)"><path d="m 12.00781,292.65001 a 1.0001,1.0001 0 0 0 -0.60351,0.21094 l -9.01758,7 A 1.0001,1.0001 0 0 0 2,300.65001 v 8.73633 c 0,1.7908 1.47287,3.26367 3.26367,3.26367 h 13.47266 c 1.7908,0 3.26367,-1.47287 3.26367,-3.26367 v -8.73633 a 1.0001,1.0001 0 0 0 -0.38477,-0.78906 l -8.98242,-7 a 1.0001,1.0001 0 0 0 -0.625,-0.21094 z m 0.008,2.26758 7.98439,6.2207 v 8.24805 c 0,0.71837 -0.5453,1.26367 -1.26367,1.26367 H 16 v -5 c 0,-2.1987 -1.8013,-4 -4,-4 -2.1987,0 -4,1.8013 -4,4 v 5 H 5.26367 C 4.5453,310.65001 4,310.10471 4,309.38634 v -8.24805 z M 12,303.65001 c 1.1253,0 2,0.8747 2,2 v 5 h -4 v -5 c 0,-1.1253 0.8747,-2 2,-2 z" id="rect1251" style="color:#000000;font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:medium;line-height:normal;font-family:sans-serif;font-variant-ligatures:normal;font-variant-position:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-alternates:normal;font-variant-east-asian:normal;font-feature-settings:normal;font-variation-settings:normal;text-indent:0;text-align:start;text-decoration:none;text-decoration-line:none;text-decoration-style:solid;text-decoration-color:#000000;letter-spacing:normal;word-spacing:normal;text-transform:none;writing-mode:lr-tb;direction:ltr;text-orientation:mixed;dominant-baseline:auto;baseline-shift:baseline;text-anchor:start;white-space:normal;shape-padding:0;shape-margin:0;inline-size:0;clip-rule:nonzero;display:inline;overflow:visible;visibility:visible;opacity:1;isolation:auto;mix-blend-mode:normal;color-interpolation:sRGB;color-interpolation-filters:linearRGB;solid-color:#000000;solid-opacity:1;vector-effect:none;fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;color-rendering:auto;image-rendering:auto;shape-rendering:auto;text-rendering:auto;enable-background:accumulate;stop-color:#000000;stop-opacity:1"/></g></svg></div>`;

 case 'collapse': return iconDiv(name, btnId, style) + `
        <?xml version="1.0" ?><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="12 7.59 7.05 2.64 5.64 4.05 12 10.41 18.36 4.05 16.95 2.64 12 7.59"/><polygon points="5.64 19.95 7.05 21.36 12 16.41 16.95 21.36 18.36 19.95 12 13.59 5.64 19.95"/></svg></div>`;

 case 'expand': return iconDiv(name, btnId, style) + `
        <?xml version="1.0" ?><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="12 19.24 7.05 14.29 5.64 15.71 12 22.07 18.36 15.71 16.95 14.29 12 19.24"/><polygon points="5.64 8.29 7.05 9.71 12 4.76 16.95 9.71 18.36 8.29 12 1.93 5.64 8.29"/></svg></div>`;

 case 'refsup': return iconDiv(name, btnId, style) + `
        <?xml version="1.0" ?><svg viewBox="0 0 576 512" xmlns="http://www.w3.org/2000/svg"><path d="M544 416h-223.1c-17.67 0-32 14.33-32 32s14.33 32 32 32H544c17.67 0 32-14.33 32-32S561.7 416 544 416zM320 96h32c17.67 0 31.1-14.33 31.1-32s-14.33-32-31.1-32h-32c-17.67 0-32 14.33-32 32S302.3 96 320 96zM320 224H416c17.67 0 32-14.33 32-32s-14.33-32-32-32h-95.1c-17.67 0-32 14.33-32 32S302.3 224 320 224zM320 352H480c17.67 0 32-14.33 32-32s-14.33-32-32-32h-159.1c-17.67 0-32 14.33-32 32S302.3 352 320 352zM151.6 41.95c-12.12-13.26-35.06-13.26-47.19 0l-87.1 96.09C4.475 151.1 5.35 171.4 18.38 183.3c6.141 5.629 13.89 8.414 21.61 8.414c8.672 0 17.3-3.504 23.61-10.39L96 145.9v302C96 465.7 110.3 480 128 480s32-14.33 32-32.03V145.9L192.4 181.3C204.4 194.3 224.6 195.3 237.6 183.3c13.03-11.95 13.9-32.22 1.969-45.27L151.6 41.95z"/></svg></div>`;

 case 'isolate': return iconDiv(name, btnId, style) + `
        <?xml version="1.0" ?><svg id="svg8" version="1.1" viewBox="0 0 12.7 12.7" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg"><g id="layer1" transform="translate(0,-284.29998)"><path d="m 9.8777781,289.9444 v 1.41112 H 2.8222223 v -1.41112 z" id="path4507" style="fill:#000000;fill-opacity:1;fill-rule:evenodd;stroke:none;stroke-width:0.70555556px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"/></g></svg></div>`;
  }
}

module.exports = { iconHtml };