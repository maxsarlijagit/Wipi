// Detects a newly completed assistant message; no conversation text leaves the tab.
let wasGenerating = false;
let lastAssistantText = '';
let lastSentText = '';
let stableTimer;
function inspect() {
  const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
  const last = messages[messages.length - 1];
  const text = last?.innerText?.trim() || '';
  const stop = document.querySelector('[data-testid="stop-button"],button[aria-label="Stop generating"],button[aria-label="Detener generación"]');
  if (stop) wasGenerating = true;
  if (text !== lastAssistantText) {
    lastAssistantText = text;
    clearTimeout(stableTimer);
  }
  if (!stop && wasGenerating && text && text !== lastSentText) {
    wasGenerating = false;
    stableTimer = setTimeout(() => {
      if (lastAssistantText !== lastSentText && !document.querySelector('[data-testid="stop-button"],button[aria-label="Stop generating"],button[aria-label="Detener generación"]')) {
        lastSentText = lastAssistantText;
        chrome.runtime.sendMessage({ type: 'chatgpt-complete' });
      }
    }, 1100);
  }
}
const initial = document.querySelectorAll('[data-message-author-role="assistant"]');
lastAssistantText = initial[initial.length - 1]?.innerText?.trim() || '';
lastSentText = lastAssistantText;
new MutationObserver(() => { clearTimeout(window.wipiObserverDelay); window.wipiObserverDelay = setTimeout(inspect, 250); }).observe(document.documentElement, { childList: true, subtree: true, characterData: true });
