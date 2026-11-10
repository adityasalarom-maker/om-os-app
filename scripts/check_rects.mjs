const targets = await (await fetch('http://localhost:9222/json')).json();
const pageTarget = targets.find(t => t.type === 'page');
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

ws.onopen = () => {
  ws.send(JSON.stringify({
    id: 1,
    method: 'Runtime.evaluate',
    params: {
      expression: `
        (() => {
          const doc = document.querySelector('iframe')?.contentDocument;
          if (!doc) return 'no iframe doc';
          const bBtn = doc.getElementById('backupBtn');
          const rBtn = doc.getElementById('restoreBtn');
          const sBtn = doc.getElementById('syncBtn');
          const winWidth = doc.defaultView.innerWidth;
          const global = doc.querySelector('.global');
          return {
            windowInnerWidth: winWidth,
            globalScrollWidth: global ? global.scrollWidth : null,
            globalClientWidth: global ? global.clientWidth : null,
            backupRect: bBtn ? { left: bBtn.getBoundingClientRect().left, right: bBtn.getBoundingClientRect().right, width: bBtn.getBoundingClientRect().width } : null,
            restoreRect: rBtn ? { left: rBtn.getBoundingClientRect().left, right: rBtn.getBoundingClientRect().right, width: rBtn.getBoundingClientRect().width } : null,
            syncRect: sBtn ? { left: sBtn.getBoundingClientRect().left, right: sBtn.getBoundingClientRect().right, width: sBtn.getBoundingClientRect().width } : null
          };
        })()
      `,
      returnByValue: true
    }
  }));
};

ws.onmessage = (event) => {
  console.log('Rects:', JSON.stringify(JSON.parse(event.data).result.result.value, null, 2));
  process.exit(0);
};
