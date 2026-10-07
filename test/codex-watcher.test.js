const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { CodexWatcher, sourceFor } = require('../src/codex-watcher');

test('desktop origins identify ChatGPT Work and Codex separately', () => {
  assert.equal(sourceFor('codex_work_desktop'), 'chatgpt');
  assert.equal(sourceFor('Codex Desktop'), 'codex');
  assert.equal(sourceFor('codex-tui'), 'codex-cli');
});

test('new short Codex sessions still produce a completion event', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'wipi-test-'));
  try {
    const notices = [];
    const watcher = new CodexWatcher(event => notices.push(event), () => {}, home);
    watcher.scan(true);
    const date = new Date();
    const dir = path.join(home,'sessions',String(date.getFullYear()),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0'));
    fs.mkdirSync(dir,{recursive:true});
    const file = path.join(dir,'rollout-new.jsonl');
    fs.writeFileSync(file, [
      {type:'session_meta',payload:{cwd:'G:\\work\\Project One',originator:'Codex Desktop',base_instructions:'x'.repeat(20000)}},
      {type:'event_msg',payload:{type:'task_started',turn_id:'turn-1',started_at:Date.now()/1000}},
      {type:'event_msg',payload:{type:'task_complete',turn_id:'turn-1',completed_at:Date.now()/1000}},
    ].map(JSON.stringify).join('\n')+'\n');
    watcher.scan(false);
    assert.equal(notices.length,1);
    assert.equal(notices[0].id,'turn-1');
    assert.equal(notices[0].source,'codex');
    watcher.scan(false);
    assert.equal(notices.length,1);
  } finally { fs.rmSync(home,{recursive:true,force:true}); }
});

test('ChatGPT Windows local Work task ends with a ChatGPT alert', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'wipi-test-'));
  try {
    const date = new Date();
    const dir = path.join(home,'sessions',String(date.getFullYear()),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0'));
    fs.mkdirSync(dir,{recursive:true});
    const file = path.join(dir,'rollout-work.jsonl');
    fs.writeFileSync(file, [
      {type:'session_meta',payload:{cwd:'G:\\work\\Sample',originator:'codex_work_desktop'}},
      {type:'event_msg',payload:{type:'task_started',turn_id:'turn-work',started_at:Date.now()/1000}},
    ].map(JSON.stringify).join('\n')+'\n');
    const notices = [];
    const watcher = new CodexWatcher(event => notices.push(event), () => {}, home);
    watcher.scan(true);
    assert.equal(watcher.snapshot()[0].source,'chatgpt');
    fs.appendFileSync(file,JSON.stringify({type:'event_msg',payload:{type:'task_complete',turn_id:'turn-work',completed_at:Date.now()/1000}})+'\n');
    watcher.scan(false);
    assert.equal(watcher.snapshot().length,0);
    assert.equal(notices.length,1);
    assert.equal(notices[0].source,'chatgpt');
  } finally { fs.rmSync(home,{recursive:true,force:true}); }
});

test('aborted desktop turn leaves the active list and reports interruption', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'wipi-test-'));
  try {
    const date = new Date();
    const dir = path.join(home,'sessions',String(date.getFullYear()),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0'));
    fs.mkdirSync(dir,{recursive:true});
    const file = path.join(dir,'rollout-aborted.jsonl');
    fs.writeFileSync(file, [
      {type:'session_meta',payload:{cwd:'G:\\work\\Sample',originator:'Codex Desktop'}},
      {type:'event_msg',payload:{type:'task_started',turn_id:'turn-abort',started_at:Date.now()/1000}},
    ].map(JSON.stringify).join('\n')+'\n');
    const notices = [];
    const watcher = new CodexWatcher(event => notices.push(event), () => {}, home);
    watcher.scan(true);
    fs.appendFileSync(file,JSON.stringify({type:'event_msg',payload:{type:'turn_aborted',turn_id:'turn-abort',completed_at:Date.now()/1000}})+'\n');
    watcher.scan(false);
    assert.equal(watcher.snapshot().length,0);
    assert.match(notices[0].title,/interrumpido/);
  } finally { fs.rmSync(home,{recursive:true,force:true}); }
});

test('running sessions expose project and work stage, then leave the active list', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'wipi-test-'));
  try {
    const date = new Date();
    const dir = path.join(home,'sessions',String(date.getFullYear()),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0'));
    fs.mkdirSync(dir,{recursive:true});
    const file = path.join(dir,'rollout-live.jsonl');
    const rows = [
      {type:'session_meta',payload:{cwd:'G:\\work\\Project One',originator:'Codex Desktop'}},
      {type:'event_msg',payload:{type:'task_started',turn_id:'turn-live',started_at:Date.now()/1000}},
      {type:'event_msg',payload:{type:'item_completed',turn_id:'turn-live',item:{type:'FileChange'},completed_at_ms:Date.now()}},
    ];
    fs.writeFileSync(file,rows.map(JSON.stringify).join('\n')+'\n');
    const states = [];
    const notices = [];
    const watcher = new CodexWatcher(event => notices.push(event), state => states.push(state), home);
    watcher.scan(true);
    assert.equal(watcher.snapshot()[0].project,'Project One');
    assert.equal(watcher.snapshot()[0].stage,'Edición de archivos');
    assert.equal(states.length,1);
    fs.appendFileSync(file,JSON.stringify({type:'event_msg',payload:{type:'task_complete',turn_id:'turn-live',completed_at:Date.now()/1000}})+'\n');
    watcher.scan(false);
    assert.equal(watcher.snapshot().length,0);
    assert.equal(notices.length,1);
  } finally { fs.rmSync(home,{recursive:true,force:true}); }
});
