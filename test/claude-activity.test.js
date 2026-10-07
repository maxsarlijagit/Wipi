const test = require('node:test');
const assert = require('node:assert/strict');
const { ClaudeActivityTracker } = require('../src/claude-activity');

test('Claude Code hook lifecycle shows work and emits one completion notice', () => {
  let now = 1000;
  const notices = [];
  const tracker = new ClaudeActivityTracker(event => notices.push(event), () => {}, () => now);
  const common = { session_id: 'session-1', cwd: 'G:\\work\\Demo', prompt_id: 'prompt-1' };
  assert.equal(tracker.consume({ ...common, hook_event_name: 'UserPromptSubmit' }), true);
  assert.equal(tracker.snapshot()[0].project, 'Demo');
  assert.equal(tracker.snapshot()[0].stage, 'Analizando');
  now += 1000;
  tracker.consume({ ...common, hook_event_name: 'PreToolUse', tool_name: 'Edit' });
  assert.equal(tracker.snapshot()[0].stage, 'Edición de archivos');
  now += 1000;
  tracker.consume({ ...common, hook_event_name: 'Stop' });
  tracker.consume({ ...common, hook_event_name: 'Stop' });
  assert.equal(tracker.snapshot().length, 0);
  assert.equal(notices.length, 1);
  assert.equal(notices[0].source, 'claude');
  assert.equal(notices[0].id, 'claude:session-1:prompt-1');
});

test('Claude Code interrupted turns and quiet sessions do not remain active forever', () => {
  let now = 1000;
  const notices = [];
  const tracker = new ClaudeActivityTracker(event => notices.push(event), () => {}, () => now);
  tracker.consume({ session_id: 'one', cwd: 'G:\\Demo', hook_event_name: 'UserPromptSubmit' });
  now += 11 * 60 * 1000;
  assert.equal(tracker.snapshot()[0].quiet, true);
  now += 50 * 60 * 1000;
  assert.equal(tracker.snapshot().length, 0);
  tracker.consume({ session_id: 'two', cwd: 'G:\\Demo', hook_event_name: 'UserPromptSubmit' });
  tracker.consume({ session_id: 'two', hook_event_name: 'StopFailure' });
  assert.match(notices[0].title, /interrumpido/);
  tracker.consume({ session_id: 'two', hook_event_name: 'SessionEnd' });
  assert.equal(tracker.snapshot().length, 0);
});
