(function () {
  /* global window document Prism */

///////////// iframe script
  
  console.log('started def-stk-script.js');

  debugger;

  function send(command, data) {  
    console.log('iframe sending to webview', {command, data});
    window.parent.postMessage({src:'iframe', command, data}, '*');
  };
  send('ready', {});

  function addPre(html, language) {
    console.log('addPre', {html, language});
    const tempDiv     = document.createElement('div');
    tempDiv.innerHTML = html;
    const preEle      = tempDiv.firstChild;
    const klass       = `language-${language}`;
    if(language) preEle.classList.add(klass);
    document.body.appendChild(preEle);
    console.log('before highlightAll', {Prism, preEle, klass, highlightAll: Prism.highlightAll});
    Prism.highlightAll();
    // document.querySelector(`.${klass}`).classList.remove(klass);
    preEle.classList.remove(klass);
  }

  function recv(command, data) {
    switch (command) {
      case 'addPre': addPre(data.html, data.language); break;
    }
  }

  // Listen for message from webview
  window.addEventListener('message', event => {
    const message = event.data;
    console.log('iframe received message from webview:', message);
    const {command, data} = message;
    recv(command, data);
  });

}());
