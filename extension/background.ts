// User-initiated injection avoids persistent access to every patient portal.
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url?.startsWith('https://')) return;
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
    await chrome.action.setBadgeText({ text: '', tabId: tab.id });
  } catch {
    await chrome.action.setBadgeText({ text: '!', tabId: tab.id });
  }
});
