const targets = await (await fetch('http://localhost:9222/json')).json();
const pageTarget = targets.find(t => t.type === 'page');
if (!pageTarget) {
  console.log('No page target found');
  process.exit(1);
}
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

function send(method, params = {}) {
  return new Promise((resolve) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (event) => {
      const data = JSON.parse(event.data);
      if (data.id === id) {
        ws.removeEventListener('message', handler);
        resolve(data.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

ws.onopen = async () => {
  try {
    // 1. Navigate to ?view=notes-pro if not there
    const navResult = await send('Runtime.evaluate', {
      expression: `
        (() => {
          if (!window.location.search.includes('view=notes-pro')) {
            window.location.href = 'https://localhost/?view=notes-pro';
            return 'navigating';
          }
          return 'already-there';
        })()
      `,
      returnByValue: true
    });
    console.log('Navigation status:', navResult.result.value);

    // Give it 1.5s to load if navigating
    if (navResult.result.value === 'navigating') {
      await new Promise(r => setTimeout(r, 2000));
    }

    // 2. Automate vault unlock inside the iframe
    const unlockResult = await send('Runtime.evaluate', {
      expression: `
        (async () => {
          const iframe = document.querySelector('iframe');
          if (!iframe) return { error: 'iframe not mounted yet' };
          const win = iframe.contentWindow;
          const doc = iframe.contentDocument;
          if (!doc) return { error: 'cannot access iframe doc' };

          const vaultGate = doc.getElementById('vaultGate');
          if (vaultGate && !vaultGate.hidden) {
            const passField = doc.getElementById('vaultPassphrase');
            const confirmField = doc.getElementById('vaultPassphraseConfirm');
            const PASSPHRASE = 'OmSovereignVault2026!';
            if (passField) passField.value = PASSPHRASE;
            if (confirmField && !doc.getElementById('vaultConfirmLabel')?.hidden) {
              confirmField.value = PASSPHRASE;
            }
            await win.createOrUnlockLocalVault();
          }

          const bBtn = doc.getElementById('backupBtn');
          const rBtn = doc.getElementById('restoreBtn');
          const sBtn = doc.getElementById('syncBtn');
          const winWidth = doc.defaultView.innerWidth;

          return {
            unlocked: vaultGate ? vaultGate.hidden : true,
            windowWidth: winWidth,
            backupRect: bBtn ? { left: bBtn.getBoundingClientRect().left, right: bBtn.getBoundingClientRect().right, width: bBtn.getBoundingClientRect().width } : null,
            restoreRect: rBtn ? { left: rBtn.getBoundingClientRect().left, right: rBtn.getBoundingClientRect().right, width: rBtn.getBoundingClientRect().width } : null,
            syncRect: sBtn ? { left: sBtn.getBoundingClientRect().left, right: sBtn.getBoundingClientRect().right, width: sBtn.getBoundingClientRect().width } : null
          };
        })()
      `,
      awaitPromise: true,
      returnByValue: true
    });

    console.log('Unlock and Button Rects:', JSON.stringify(unlockResult.result.value, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Execution Error:', err);
    process.exit(1);
  }
};
