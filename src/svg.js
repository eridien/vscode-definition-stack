const div = `<div style="display:inline-block; width:20px; height:20px;
              position:relative; top:3px; left:-6px; margin:0 4px 0 4px;
              border: 1px solid black; border-radius:5px; background-color:white;">`;

function iconHtml(name) {
  switch(name) {
    case 'close-border': return `${div}
        <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M464 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm0 394c0 3.3-2.7 6-6 6H54c-3.3 0-6-2.7-6-6V86c0-3.3 2.7-6 6-6h404c3.3 0 6 2.7 6 6v340zM356.5 194.6L295.1 256l61.4 61.4c4.6 4.6 4.6 12.1 0 16.8l-22.3 22.3c-4.6 4.6-12.1 4.6-16.8 0L256 295.1l-61.4 61.4c-4.6 4.6-12.1 4.6-16.8 0l-22.3-22.3c-4.6-4.6-4.6-12.1 0-16.8l61.4-61.4-61.4-61.4c-4.6-4.6-4.6-12.1 0-16.8l22.3-22.3c4.6-4.6 12.1-4.6 16.8 0l61.4 61.4 61.4-61.4c4.6-4.6 12.1-4.6 16.8 0l22.3 22.3c4.7 4.6 4.7 12.1 0 16.8z"/></svg></div>`;

    case 'close': return `${div}
        <?xml version="1.0" ?><!DOCTYPE svg  PUBLIC '-//W3C//DTD SVG 1.1//EN'  'http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd'><svg viewBox="0 0 512 512" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M437.5,386.6L306.9,256l130.6-130.6c14.1-14.1,14.1-36.8,0-50.9c-14.1-14.1-36.8-14.1-50.9,0L256,205.1L125.4,74.5  c-14.1-14.1-36.8-14.1-50.9,0c-14.1,14.1-14.1,36.8,0,50.9L205.1,256L74.5,386.6c-14.1,14.1-14.1,36.8,0,50.9  c14.1,14.1,36.8,14.1,50.9,0L256,306.9l130.6,130.6c14.1,14.1,36.8,14.1,50.9,0C451.5,423.4,451.5,400.6,437.5,386.6z"/></svg></div>`;

    case 'collapse': return `${div}
        <?xml version="1.0" ?><svg data-name="Layer 1" id="Layer_1" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path d="M414.11,186.39h-88.5V97.89h29.92v37.43L456.84,34,478,55.16,376.68,156.47h37.43Zm0,169.14V325.61h-88.5v88.5h29.92V376.68L456.84,478,478,456.84,376.68,355.53Zm-316.22,0h37.43L34,456.84,55.16,478,156.47,376.68v37.43h29.92v-88.5H97.89Zm58.58-220.21L55.16,34,34,55.16,135.32,156.47H97.89v29.92h88.5V97.89H156.47Z"/></svg></div>`;

 case 'collapse-button': return `${div}
        <?xml version="1.0" ?><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><polygon points="364.52 199.26 333.95 199.26 408.52 124.69 387.31 103.48 312.74 178.05 312.74 147.48 282.74 147.48 282.74 229.26 364.52 229.26 364.52 199.26"/><path d="M448,34H34V478H478V34Zm0,414H64V64H448Z"/><polygon points="312.74 333.95 387.31 408.52 408.52 387.31 333.95 312.74 364.52 312.74 364.52 282.74 282.74 282.74 282.74 364.52 312.74 364.52 312.74 333.95"/><polygon points="199.26 333.95 199.26 364.52 229.26 364.52 229.26 282.74 147.48 282.74 147.48 312.74 178.05 312.74 103.48 387.31 124.69 408.52 199.26 333.95"/><polygon points="147.48 199.26 147.48 229.26 229.26 229.26 229.26 147.48 199.26 147.48 199.26 178.05 124.69 103.48 103.48 124.69 178.05 199.26 147.48 199.26"/></svg></div>`;

 case 'caret-up': return `${div}
        <?xml version="1.0" ?><svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><polygon points="396.6,352 416,331.3 256,160 96,331.3 115.3,352 256,201.5 "/></svg></div>`;

 case 'caret-down': return `${div}
        <?xml version="1.0" ?><svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"><rect fill="none" height="256" width="256"/><polyline fill="none" points="208 96 128 176 48 96" stroke="#000" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg></div>`;

 case 'home1': return `${div}
        <?xml version="1.0" ?><svg height="24" viewBox="0 0 40 40" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M17.8913288,10 L11.8900003,3.99867157 L5.88867192,10 L5.89001465,10 L5.89001465,20 L17.8900146,20 L17.8900146,10 L17.8913288,10 Z M19.8900146,11.9986859 L19.8900146,20 C19.8900146,21.1045695 18.9945841,22 17.8900146,22 L5.89001465,22 C4.78544515,22 3.89001465,21.1045695 3.89001465,20 L3.89001465,11.9986573 L2.41319817,13.4754737 L1,12.0622756 L10.4769858,2.5852898 C11.2573722,1.8049034 12.5226285,1.8049034 13.3030149,2.5852898 L22.7800007,12.0622756 L21.3668025,13.4754737 L19.8900146,11.9986859 Z" fill-rule="evenodd"/></svg></div>`;

 case 'home2': return `${div}
        <?xml version="1.0" ?><svg data-name="50. Home" id="_50._Home" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M23.673,10.26l-11-10a1,1,0,0,0-1.346,0l-11,10A1,1,0,0,0,1,12H3V23a1,1,0,0,0,1,1H20a1,1,0,0,0,1-1V12h2a1,1,0,0,0,.673-1.74ZM10,22V18h4v4ZM20,10a1,1,0,0,0-1,1V22H16V18a2,2,0,0,0-2-2H10a2,2,0,0,0-2,2v4H5V11a1,1,0,0,0-1-1H3.587L12,2.352,20.413,10Z"/><path d="M9,11a3,3,0,1,0,3-3A3,3,0,0,0,9,11Zm4,0a1,1,0,1,1-1-1A1,1,0,0,1,13,11Z"/></svg></div>`;

 case 'home3': return `${div}
        <?xml version="1.0" ?><svg viewBox="-1 0 26 26" xmlns="http://www.w3.org/2000/svg" xmlns:cc="http://creativecommons.org/ns#" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:svg="http://www.w3.org/2000/svg"><defs id="defs2"/><g id="g1265" style="display:inline" transform="translate(-1.0999855e-7,-290.64998)"><path d="m 12.00781,292.65001 a 1.0001,1.0001 0 0 0 -0.60351,0.21094 l -9.01758,7 A 1.0001,1.0001 0 0 0 2,300.65001 v 8.73633 c 0,1.7908 1.47287,3.26367 3.26367,3.26367 h 13.47266 c 1.7908,0 3.26367,-1.47287 3.26367,-3.26367 v -8.73633 a 1.0001,1.0001 0 0 0 -0.38477,-0.78906 l -8.98242,-7 a 1.0001,1.0001 0 0 0 -0.625,-0.21094 z m 0.008,2.26758 7.98439,6.2207 v 8.24805 c 0,0.71837 -0.5453,1.26367 -1.26367,1.26367 H 16 v -5 c 0,-2.1987 -1.8013,-4 -4,-4 -2.1987,0 -4,1.8013 -4,4 v 5 H 5.26367 C 4.5453,310.65001 4,310.10471 4,309.38634 v -8.24805 z M 12,303.65001 c 1.1253,0 2,0.8747 2,2 v 5 h -4 v -5 c 0,-1.1253 0.8747,-2 2,-2 z" id="rect1251" style="color:#000000;font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-size:medium;line-height:normal;font-family:sans-serif;font-variant-ligatures:normal;font-variant-position:normal;font-variant-caps:normal;font-variant-numeric:normal;font-variant-alternates:normal;font-variant-east-asian:normal;font-feature-settings:normal;font-variation-settings:normal;text-indent:0;text-align:start;text-decoration:none;text-decoration-line:none;text-decoration-style:solid;text-decoration-color:#000000;letter-spacing:normal;word-spacing:normal;text-transform:none;writing-mode:lr-tb;direction:ltr;text-orientation:mixed;dominant-baseline:auto;baseline-shift:baseline;text-anchor:start;white-space:normal;shape-padding:0;shape-margin:0;inline-size:0;clip-rule:nonzero;display:inline;overflow:visible;visibility:visible;opacity:1;isolation:auto;mix-blend-mode:normal;color-interpolation:sRGB;color-interpolation-filters:linearRGB;solid-color:#000000;solid-opacity:1;vector-effect:none;fill:#000000;fill-opacity:1;fill-rule:nonzero;stroke:none;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1;color-rendering:auto;image-rendering:auto;shape-rendering:auto;text-rendering:auto;enable-background:accumulate;stop-color:#000000;stop-opacity:1"/></g></svg></div>`;

 case 'collapse-vert': return `${div}
        <?xml version="1.0" ?><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="12 7.59 7.05 2.64 5.64 4.05 12 10.41 18.36 4.05 16.95 2.64 12 7.59"/><polygon points="5.64 19.95 7.05 21.36 12 16.41 16.95 21.36 18.36 19.95 12 13.59 5.64 19.95"/></svg></div>`;

 case 'expand-vert': return `${div}
        <?xml version="1.0" ?><svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="12 19.24 7.05 14.29 5.64 15.71 12 22.07 18.36 15.71 16.95 14.29 12 19.24"/><polygon points="5.64 8.29 7.05 9.71 12 4.76 16.95 9.71 18.36 8.29 12 1.93 5.64 8.29"/></svg></div>`;

  }
}

module.exports = { iconHtml };