//////////////// definition stack iframe script //////////////////
  
  /* global window document Prism */

  console.log('iframe started');

  debugger;

  function send(command, data) {  
    // console.log('iframe sending to webview', {command, data});
    window.parent.postMessage({src:'iframe', command, data}, '*');
  };

  document.addEventListener('DOMContentLoaded', () => {
    send('ready', {});
  });

  function addPre(html, language) {
    const tempDiv     = document.createElement('div');
    tempDiv.innerHTML = html;
    const preEle      = tempDiv.firstElementChild;
    const klass       = `language-${language}`;
    if(language) {
      preEle.classList.add(klass);
    }
    console.log('preEle before appending:', preEle);

    document.body.appendChild(preEle);

    const bodyEle = document.body;
    
    console.log('iframeEle before highlightAll:', bodyEle);

    Prism.highlightAll();

    console.log('iframeEle after highlightAll:', bodyEle);

// .outerHTML

  }

  function recv(command, data) {
    switch (command) {
      case 'addPre': addPre(data.html, data.language); break;
    }
  }

  // Listen for message from webview
  window.addEventListener('message', event => {
    const message = event.data;
    // console.log('iframe received message from webview:', message);
    const {command, data} = message;
    recv(command, data);
  });
