import { classifyUrl } from './classify.js';

const pending = new Map();
const creatingGroups = new Map();

async function ensureGroup(tab, title, retry = true) {
  const key = `${tab.windowId}\u0000${title}`;
  const existing = creatingGroups.get(key);
  if (existing) {
    try {
      return await existing;
    } catch (error) {
      if (!retry) throw error;
      if (creatingGroups.get(key) === existing) creatingGroups.delete(key);
      return ensureGroup(tab, title, false);
    }
  }

  const promise = (async () => {
    const groups = await chrome.tabGroups.query({ windowId: tab.windowId });
    console.log('[ATG] groups query', {
      windowId: tab.windowId,
      groups: groups.map(group => ({ id: group.id, title: group.title, windowId: group.windowId }))
    });
    const group = groups.find(candidate => candidate.title === title);
    console.log('[ATG] group match', group ? { id: group.id, title: group.title, windowId: group.windowId } : null);
    if (group) return group;

    const groupId = await chrome.tabs.group({
      tabIds: [tab.id],
      createProperties: { windowId: tab.windowId }
    });
    await chrome.tabGroups.update(groupId, { title });
    console.log('[ATG] group create', { groupId, title, windowId: tab.windowId });
    return { id: groupId, title, windowId: tab.windowId };
  })();

  creatingGroups.set(key, promise);
  try {
    return await promise;
  } finally {
    if (creatingGroups.get(key) === promise) creatingGroups.delete(key);
  }
}

async function placeTab(tab, url) {
  const title = classifyUrl(url);
  console.log('[ATG] placeTab start', {
    tabId: tab?.id,
    windowId: tab?.windowId,
    groupId: tab?.groupId,
    title,
    pending: tab?.id != null && pending.has(tab.id)
  });
  if (!title || tab?.id == null || tab?.windowId == null) return;
  if (pending.has(tab.id)) {
    if (pending.get(tab.id) !== url) pending.set(tab.id, url);
    return;
  }
  pending.set(tab.id, url);
  try {
    const group = await ensureGroup(tab, title);
    if (tab.groupId === group.id) {
      console.log('[ATG] already grouped', { tabId: tab.id, groupId: group.id });
      return;
    }
    console.log('[ATG] tabs.group call', { tabIds: [tab.id], groupId: group.id, windowId: tab.windowId });
    const groupId = await chrome.tabs.group({ tabIds: [tab.id], groupId: group.id });
    console.log('[ATG] tabs.group ok', { tabId: tab.id, groupId, windowId: tab.windowId });
  } catch (error) {
    console.log('[ATG] failure', { message: error?.message, stack: error?.stack });
  } finally {
    const latestUrl = pending.get(tab.id);
    pending.delete(tab.id);
    if (latestUrl && latestUrl !== url) placeTab(tab, latestUrl);
    console.log('[ATG] placeTab end', { tabId: tab.id });
  }
}

chrome.tabs.onCreated.addListener(tab => {
  console.log('[ATG] onCreated', { tabId: tab.id, windowId: tab.windowId, groupId: tab.groupId, url: tab.url });
  if (tab.id != null && tab.url) placeTab(tab, tab.url);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('[ATG] onUpdated', {
    tabId,
    url: changeInfo.url,
    windowId: tab?.windowId,
    groupId: tab?.groupId
  });
  if (changeInfo.url) placeTab(tab, changeInfo.url);
});

chrome.windows.onCreated.addListener(async windowInfo => {
  console.log('[ATG] onWindowCreated', { windowId: windowInfo?.id });
  if (windowInfo?.id == null) return;
  try {
    const tabs = await chrome.tabs.query({ windowId: windowInfo.id });
    for (const tab of tabs) {
      if (tab.url) placeTab(tab, tab.url);
    }
  } catch (error) {
    console.log('[ATG] failure', { message: error?.message, stack: error?.stack });
  }
});
