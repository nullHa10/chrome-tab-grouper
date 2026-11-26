import { classifyUrl } from './classify.js';

const pending = new Set();

async function placeTab(tabId, url) {
  const title = classifyUrl(url);
  if (!title || pending.has(tabId)) return;
  pending.add(tabId);
  try {
    const groups = await chrome.tabGroups.query({});
    const group = groups.find(candidate => candidate.title === title);
    if (!group) return;
    const tab = await chrome.tabs.get(tabId);
    if (tab.groupId === group.id) return;
    await chrome.tabs.group({ tabIds: [tabId], groupId: group.id });
  } catch (error) {
    console.log('automatic tab grouping failed', error);
  } finally {
    pending.delete(tabId);
  }
}

chrome.tabs.onCreated.addListener(tab => {
  if (tab.id != null && tab.url) placeTab(tab.id, tab.url);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.url) placeTab(tabId, changeInfo.url);
});
