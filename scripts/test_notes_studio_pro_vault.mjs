import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const html = await readFile(new URL('../public/notes-studio-pro.html', import.meta.url), 'utf8');
const start = html.indexOf('function toBase64Url(bytes){');
const end = html.indexOf('async function signedSyncHeaders', start);
assert.notEqual(start, -1, 'vault crypto helpers exist');
assert.notEqual(end, -1, 'vault helper section has a stable boundary');

const helpers = html.slice(start, end);
const context = vm.createContext({
  crypto: webcrypto,
  TextEncoder,
  TextDecoder,
  Uint8Array,
  ArrayBuffer,
  btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
  atob: (value) => Buffer.from(value, 'base64').toString('binary'),
  LOCAL_VAULT_KEY: 'om_notes_studio_pro_local_vault_v1',
  LOCAL_VAULT_FORMAT: 'om-notes-studio-pro-local-vault-v1',
  LOCAL_VAULT_ITERATIONS: 310000,
  ENCRYPTED_BACKUP_FORMAT: 'om-notes-studio-pro-encrypted-backup-v1',
  DOMParser: class {
    parseFromString(markup) {
      return { body: { innerHTML: String(markup || ''), querySelectorAll: () => [] }, querySelectorAll: () => [] };
    }
  },
  newProNoteId: (() => { let id = 0; return () => `test-conflict-${++id}`; })(),
});

vm.runInContext(helpers, context, { filename: 'notes-studio-pro-vault-helpers.js' });
const result = await vm.runInContext(`(async () => {
  const passphrase = 'test-only vault passphrase';
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const payload = {
    format: 'om-notes-studio-pro-vault-payload-v1',
    notes: { 'Test note': { id: 'test-id', title: 'Test note', body: '<p>sentinel-private-body</p>' } },
    layout: 'threeBottom',
    tabWidths: { 'test-id': 420 },
    syncConfig: { url: 'http://127.0.0.1:8080/sync', token: 'test-only-token' },
    syncBaseHashes: { 'test-id': 'hash' }
  };
  const key = await deriveLocalVaultKey(passphrase, salt);
  const envelope = await encryptLocalVaultPayload(payload, key, salt);
  const roundTrip = await decryptLocalVaultEnvelope(envelope, passphrase);
  let wrongPassphraseRejected = false;
  try { await decryptLocalVaultEnvelope(envelope, 'incorrect test passphrase'); }
  catch (error) { wrongPassphraseRejected = /did not unlock|damaged/.test(error.message); }
  // Flip an actual decoded ciphertext bit. Changing the last base64url character
  // can only alter unused padding bits, leaving the decoded bytes unchanged.
  const tamperedBytes = fromBase64Url(envelope.ciphertext);
  tamperedBytes[Math.floor(tamperedBytes.length / 2)] ^= 1;
  const tampered = { ...envelope, ciphertext: toBase64Url(tamperedBytes) };
  let tamperRejected = false;
  try { await decryptLocalVaultEnvelope(tampered, passphrase); }
  catch { tamperRejected = true; }
  return { envelope, roundTrip, wrongPassphraseRejected, tamperRejected, payload };
})()`, context);

assert.deepEqual(JSON.parse(JSON.stringify(result.roundTrip.payload)), JSON.parse(JSON.stringify(result.payload)), 'AES-GCM vault round trip preserves notes, metadata, and sync config');
assert.equal(result.roundTrip.salt.length, 16, 'salt is 128-bit');
assert.equal(result.wrongPassphraseRejected, true, 'wrong passphrase is rejected');
assert.equal(result.tamperRejected, true, 'modified ciphertext is rejected');
assert.equal(JSON.stringify(result.envelope).includes('sentinel-private-body'), false, 'envelope does not expose note text');
assert.equal(JSON.stringify(result.envelope).includes('test-only-token'), false, 'envelope does not expose pairing credentials');
const readableStart=html.indexOf("const HUMAN_READABLE_BACKUP_FORMAT='");
const readableEnd=html.indexOf('function sanitizeImportedMarkup(',readableStart);
assert.notEqual(readableStart,-1,'human-readable export helpers exist');
assert.notEqual(readableEnd,-1,'human-readable helpers have a stable boundary');
vm.runInContext(html.slice(readableStart,readableEnd),context,{filename:'notes-studio-pro-readable-export.js'});
const duplicateTitleMap=await vm.runInContext(`proReadableManifestNotes([{id:'one',title:'Same title'},{id:'two',title:'Same title'}])`,context);
assert.deepEqual(JSON.parse(JSON.stringify(Object.keys(duplicateTitleMap))),['Same title','Same title (2)'],'readable manifest preserves duplicate-title notes without overwriting either one');
assert.match(html,/notes:proReadableManifestNotes\(notes\)/,'readable export manifest matches the title-keyed restore model');
const readableFlow=await vm.runInContext(`(async()=>{
  const manifest={format:HUMAN_READABLE_BACKUP_FORMAT,exportedAt:'2026-11-08T00:00:00.000Z',notes:{'Rich note':{id:'rich-id',title:'Rich note',body:'<p>Readable <strong>bold</strong></p><table><tr><th>Source</th></tr><tr><td>Notebook</td></tr></table>',props:'<p>Tag: demo</p>',createdAt:'2026-11-01T00:00:00.000Z',updatedAt:'2026-11-08T00:00:00.000Z'},'Markdown note':{id:'md-id',title:'Markdown note',body:'# Heading\\n\\n| A | B |\\n| --- | --- |\\n| 1 | 2 |',updatedAt:'2026-11-08T00:00:00.000Z'}}};
  const archive=proStoredZip([{name:'manifest.json',data:JSON.stringify(manifest)},{name:'index.html',data:'<h1>Notes</h1>'},{name:'notes/0001-rich-note.html',data:'<table></table>'}]);
  const file={name:'notes.zip',type:'application/zip',arrayBuffer:async()=>archive.buffer.slice(archive.byteOffset,archive.byteOffset+archive.byteLength)};
  const parsed=await parseProBackupFile(file);
  return {manifest,parsed};
})()`,context);
const readableFlowJson=JSON.parse(JSON.stringify(readableFlow));
assert.equal(readableFlowJson.parsed.format,'om-notes-studio-pro-readable-export-v1','browser ZIP reader loads the exported recovery manifest');
assert.equal(readableFlowJson.parsed.notes['Rich note'].id,'rich-id','ZIP round trip preserves stable note IDs');
const testText=value=>({nodeType:3,nodeValue:value,textContent:value});
const testElement=(tag,children=[],textContent='')=>({nodeType:1,tagName:tag.toUpperCase(),childNodes:children,children,textContent:textContent||children.map(child=>child.textContent||child.nodeValue||'').join(''),parentElement:null,getAttribute:()=>null,querySelectorAll:()=>[]});
class MarkdownFixtureParser{parseFromString(markup){
  const strong=testElement('strong',[testText('bold')]);
  const paragraph=testElement('p',[testText('Readable '),strong]);
  const heading=testElement('th',[testText('Source')]),cell=testElement('td',[testText('Notebook')]);
  const headRow=testElement('tr',[heading]),bodyRow=testElement('tr',[cell]);
  const table=testElement('table');table.querySelectorAll=selector=>selector==='tr'?[headRow,bodyRow]:[];
  return {body:{innerHTML:String(markup||''),childNodes:[paragraph,table],querySelectorAll:()=>[]},querySelectorAll:()=>[]};
}}
context.DOMParser=MarkdownFixtureParser;
vm.runInContext('function sanitizeImportedMarkup(markup){return String(markup||"")}',context);
const renderedReadable=await vm.runInContext(`({markdown:proHtmlToMarkdown('<p>Readable <strong>bold</strong></p><table></table>'),html:proNoteHtmlDocument({id:'rich-id',title:'Rich note',body:'<table><tr><td>cell</td></tr></table>',props:'',updatedAt:'2026-11-08T00:00:00.000Z'},0)})`,context);
const renderedReadableJson=JSON.parse(JSON.stringify(renderedReadable));
assert.match(renderedReadableJson.markdown,/Readable \*\*bold\*\*/,'rich HTML export preserves bold formatting in Markdown');
assert.match(renderedReadableJson.markdown,/\| Source \|\n\| --- \|\n\| Notebook \|/,'rich HTML export preserves table rows in Markdown');
assert.match(renderedReadableJson.html,/<table><tr><td>cell<\/td><\/tr><\/table>/,'HTML sidecar preserves table markup for faithful recovery');
assert.match(html,/function proHtmlToMarkdown\(markup\)/,'rich editor content has an HTML-to-Markdown export path');
assert.match(html,/if\(tag==='table'\)/,'HTML-to-Markdown conversion has a structured table path');
assert.match(html,/id="readableExportBtn"/,'readable export action is present in the Pro header');
assert.match(html,/data-ag-id="NotesStudioPro_Header_ReadableExport"/,'readable export action has a canonical UI ID');
assert.match(html,/accept="application\/json,\.json,application\/zip,\.zip"/,'restore file picker accepts readable ZIP exports');
assert.match(html,/const parsed=await parseProBackupFile\(file\)/,'restore flow imports the browser-selected ZIP through its file parser');
const exportedBackup = {
  backupFormat: 'om-notes-studio-pro-encrypted-backup-v1',
  exportedAt: '2026-11-07T00:00:00.000Z',
  vault: JSON.parse(JSON.stringify(result.envelope))
};
const restoredBackup = JSON.parse(JSON.stringify(exportedBackup));
assert.equal(restoredBackup.backupFormat, 'om-notes-studio-pro-encrypted-backup-v1', 'exported JSON declares the encrypted backup format');
const restoredPayload = await vm.runInContext(`decryptLocalVaultEnvelope(${JSON.stringify(restoredBackup.vault)}, 'test-only vault passphrase')`, context);
assert.deepEqual(JSON.parse(JSON.stringify(restoredPayload.payload)), JSON.parse(JSON.stringify(result.payload)), 'encrypted JSON export and restore preserve notes, metadata, layout, and pairing configuration');
assert.equal(JSON.stringify(restoredBackup).includes('sentinel-private-body'), false, 'downloaded JSON contains no plaintext note body');
assert.equal(JSON.stringify(restoredBackup).includes('test-only-token'), false, 'downloaded JSON contains no plaintext pairing token');

const restoreHelpersStart = html.indexOf('function sanitizeImportedMarkup(');
const restoreHelpersEnd = html.indexOf('function openRestoreDialog(', restoreHelpersStart);
assert.notEqual(restoreHelpersStart, -1, 'restore preparation helpers exist');
assert.notEqual(restoreHelpersEnd, -1, 'restore preparation helpers have a stable boundary');
vm.runInContext(html.slice(restoreHelpersStart, restoreHelpersEnd), context, { filename: 'notes-studio-pro-restore-helpers.js' });
context.restoreKey = result.roundTrip.key;
context.restoreSalt = result.roundTrip.salt;
const restoreFlow = await vm.runInContext(`(async () => {
  const encrypted = JSON.parse(${JSON.stringify(JSON.stringify(restoredBackup))});
  const prepared = await prepareProBackupRestore(encrypted, {
    passphrase: 'test-only vault passphrase', targetKey: null, targetSalt: null,
    hasExistingData: false, currentLayout: 'single', tabWidths: {}, syncConfig: {}
  });
  const replace = buildProRestorePlan({ 'Old note': { id: 'old-id', title: 'Old note', body: 'old' } }, prepared, 'replace', { tabWidths: {}, currentLayout: 'single' });
  const merge = buildProRestorePlan({ 'Existing note': { id: 'existing-id', title: 'Existing note', body: 'keep', props: '', updatedAt: '2026-01-01T00:00:00.000Z' } }, prepared, 'merge', { tabWidths: { 'existing-id': 320 }, currentLayout: 'vertical' });
  const legacy = await prepareProBackupRestore({ notes: { 'Legacy note': { title: 'Legacy note', body: '<p>legacy body</p>' } } }, {
    passphrase: '', targetKey: restoreKey, targetSalt: restoreSalt,
    hasExistingData: true, currentLayout: 'vertical', tabWidths: {}, syncConfig: {}
  });
  const flags = {};
  try { await prepareProBackupRestore(encrypted, { passphrase: 'incorrect test passphrase', targetKey: null, targetSalt: null, hasExistingData: false, currentLayout: 'single', tabWidths: {}, syncConfig: {} }); } catch (error) { flags.wrongPassphrase = /did not unlock|damaged/.test(error.message); }
  try { await prepareProBackupRestore({ backupFormat: 'unknown', vault: {} }, { passphrase: 'x', targetKey: null, targetSalt: null, hasExistingData: false, currentLayout: 'single', tabWidths: {}, syncConfig: {} }); } catch (error) { flags.unknownFormat = /not supported/.test(error.message); }
  try { await prepareProBackupRestore(encrypted, { passphrase: 'test-only vault passphrase', targetKey: null, targetSalt: null, hasExistingData: true, currentLayout: 'single', tabWidths: {}, syncConfig: {} }); } catch (error) { flags.existingLockedLibrary = /Unlock or encrypt/.test(error.message); }
  try { await prepareProBackupRestore({ notes: { 'Legacy note': { body: 'x' } } }, { passphrase: '', targetKey: null, targetSalt: null, hasExistingData: false, currentLayout: 'single', tabWidths: {}, syncConfig: {} }); } catch (error) { flags.lockedLegacy = /Create your local vault/.test(error.message); }
  try { buildProRestorePlan({}, prepared, 'unexpected', { tabWidths: {}, currentLayout: 'single' }); } catch (error) { flags.invalidMode = /either merge or replace/.test(error.message); }
  return {
    prepared: { isLegacy: prepared.isLegacy, hasTargetKey: Boolean(prepared.targetKey), saltLength: prepared.targetSalt.length, notes: prepared.notes },
    replace: { titles: Object.keys(replace.notes), layout: replace.currentLayout },
    merge: { titles: Object.keys(merge.notes), preservedLayout: merge.currentLayout, preservedWidths: merge.tabWidths },
    legacy: { isLegacy: legacy.isLegacy, title: Object.keys(legacy.notes)[0], body: legacy.notes['Legacy note'].body },
    flags
  };
})()`, context);
const restoreFlowJson = JSON.parse(JSON.stringify(restoreFlow));
assert.equal(restoreFlowJson.prepared.isLegacy, false, 'restore parser recognizes the exported encrypted backup wrapper');
assert.equal(restoreFlowJson.prepared.hasTargetKey, true, 'restore creates a target vault key when restoring to an empty device');
assert.equal(restoreFlowJson.prepared.saltLength, 16, 'new restore target gets a fresh 128-bit salt');
assert.equal(restoreFlowJson.replace.titles.includes('Old note'), false, 'replace plan removes notes absent from the backup');
assert.equal(restoreFlowJson.replace.titles.includes('Test note'), true, 'replace plan restores the backup notes');
assert.equal(restoreFlowJson.merge.titles.includes('Existing note'), true, 'merge plan preserves current notes');
assert.equal(restoreFlowJson.merge.titles.includes('Test note'), true, 'merge plan imports backup notes');
assert.equal(restoreFlowJson.merge.preservedLayout, 'vertical', 'merge leaves the current layout unchanged');
assert.deepEqual(restoreFlowJson.merge.preservedWidths, { 'existing-id': 320 }, 'merge leaves current pane widths unchanged');
assert.equal(restoreFlowJson.legacy.isLegacy, true, 'restore parser explicitly identifies legacy plaintext JSON');
assert.equal(restoreFlowJson.legacy.title, 'Legacy note', 'legacy restore retains valid note titles');
for (const [name, passed] of Object.entries(restoreFlowJson.flags)) assert.equal(passed, true, `${name} restore condition is rejected`);

const encryptedWrite = html.indexOf('localStorage.setItem(LOCAL_VAULT_KEY,serialized)');
assert.notEqual(encryptedWrite, -1, 'encrypted envelope is saved to localStorage');
assert.equal(/localStorage\.setItem\((STORAGE_KEY|LAYOUT_STORAGE_KEY|TAB_WIDTHS_KEY|SYNC_CONFIG_KEY|SYNC_BASE_HASHES_KEY)/.test(html), false, 'current code does not write plaintext legacy stores');
assert.ok(html.indexOf('localStorage.setItem(LOCAL_VAULT_KEY,serialized)', html.indexOf('async function createOrUnlockLocalVault')) < html.indexOf('applyLocalVaultPayload(verified.payload,verified.key,verified.salt)', html.indexOf('async function createOrUnlockLocalVault')), 'migration verifies the encrypted write before removing legacy copies');
const backupExport = html.slice(html.indexOf('async function downloadEncryptedLocalBackup'), html.indexOf('function sanitizeImportedMarkup'));
assert.match(backupExport, /await persistLocalVault\(\)/, 'backup export flushes the latest edits before taking the encrypted snapshot');
assert.ok(backupExport.indexOf('await persistLocalVault()') < backupExport.indexOf('localStorage.getItem(LOCAL_VAULT_KEY)'), 'backup reads the vault only after the latest encrypted save completes');

const mergeStart = html.indexOf('function mergeImportedProNotes(');
const mergeEnd = html.indexOf('function openRestoreDialog(', mergeStart);
assert.notEqual(mergeStart, -1, 'restore merge helper exists');
assert.notEqual(mergeEnd, -1, 'restore merge helper has a stable boundary');
vm.runInContext(html.slice(mergeStart, mergeEnd), context, { filename: 'notes-studio-pro-restore-merge.js' });
const mergeResult = await vm.runInContext(`mergeImportedProNotes(
  {
    'Stable note': { id: 'stable-id', title: 'Stable note', body: 'local old', props: '', updatedAt: '2026-01-01T00:00:00.000Z' },
    'Local newer': { id: 'local-id', title: 'Local newer', body: 'local version', props: '', updatedAt: '2026-03-01T00:00:00.000Z' },
    'Title collision': { id: 'local-title-id', title: 'Title collision', body: 'keep this', props: '', updatedAt: '2026-01-01T00:00:00.000Z' }
  },
  {
    'Renamed import': { id: 'stable-id', title: 'Renamed import', body: 'newer import', props: '', updatedAt: '2026-02-01T00:00:00.000Z' },
    'Local newer': { id: 'local-id', title: 'Local newer', body: 'stale import', props: '', updatedAt: '2026-02-01T00:00:00.000Z' },
    'Title collision': { id: 'remote-title-id', title: 'Title collision', body: 'other note', props: '', updatedAt: '2026-02-01T00:00:00.000Z' },
    'New note': { id: 'new-id', title: 'New note', body: 'new content', props: '', updatedAt: '2026-02-01T00:00:00.000Z' }
  }
)`, context);
const merged = JSON.parse(JSON.stringify(mergeResult));
assert.equal(merged.notes['Stable note'].id, 'stable-id', 'merge matches stable identity after a title change');
assert.equal(merged.notes['Stable note'].body, 'newer import', 'newer imported edits update the matched note');
assert.equal(merged.notes['Local newer'].body, 'local version', 'older imported edits do not overwrite newer local notes');
assert.equal(merged.notes['Local newer (imported copy)'].body, 'stale import', 'older imported edits are preserved as a conflict copy');
assert.equal(merged.notes['Title collision (2)'].body, 'other note', 'different IDs with the same title are retained as a separate note');
assert.equal(merged.notes['New note'].body, 'new content', 'new notes are added by merge');
assert.deepEqual([merged.addedCount, merged.updatedCount], [3, 1], 'merge reports added conflict/new notes and updates accurately');
assert.match(html, /vaultEnvelope:localStorage\.getItem\(LOCAL_VAULT_KEY\)/, 'restore captures the pre-import encrypted envelope for rollback');
assert.match(html, /currentEnvelope!==previous\.vaultEnvelope/, 'restore rollback detects a changed vault envelope');
assert.match(html, /if\(importMode==='replace'\)/, 'replace restore is a separate explicit mode');

console.log('Notes Studio Pro local vault/restore checks passed: AES-GCM round-trip, encrypted JSON export/restore, production restore parsing and merge/replace plans, empty-device key setup, legacy JSON handling, wrong-passphrase/format/locked-library rejection, plaintext hiding, verified migration ordering, latest-edit backup, stable-ID merge, conflict preservation, collision handling, and restore rollback guards.');
