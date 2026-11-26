import assert from 'node:assert/strict';
import test from 'node:test';

let caseNumber = 0;

async function settle() {
  await new Promise(resolve => setTimeout(resolve, 0));
}

async function loadServiceWorker(t, {
  tabs = [],
  groups = [],
  getTab,
  failGroupForTabs = new Set(),
  gateFirstGroupCall = false
} = {}) {
  const listeners = {};
  const queries = [];
  const grouped = [];
  const groupUpdates = [];
  const stateTabs = new Map(tabs.map(tab => [tab.id, { ...tab }]));
  const stateGroups = groups.map(group => ({ ...group }));
  let nextGroupId = 1000;
  let firstGroupCallSeen = false;
  let releaseFirstGroup;
  const firstGroupGate = new Promise(resolve => { releaseFirstGroup = resolve; });

  globalThis.chrome = {
    tabs: {
      onCreated: { addListener: listener => { listeners.created = listener; } },
      onUpdated: { addListener: listener => { listeners.updated = listener; } },
      onMoved: { addListener: listener => { listeners.moved = listener; } },
      get: getTab || (async id => stateTabs.get(id)),
      query: async queryInfo => [...stateTabs.values()].filter(tab =>
        Object.entries(queryInfo).every(([key, value]) => tab[key] === value)
      ),
      group: async options => {
        grouped.push(options);
        if (gateFirstGroupCall && !firstGroupCallSeen) {
          firstGroupCallSeen = true;
          await firstGroupGate;
        }
        if (options.tabIds.some(tabId => failGroupForTabs.has(tabId))) {
          throw new Error('tab unavailable');
        }
        let group = stateGroups.find(candidate => candidate.id === options.groupId);
        if (!group) {
          group = {
            id: nextGroupId++,
            title: undefined,
            windowId: options.createProperties?.windowId,
            collapsed: false
          };
          stateGroups.push(group);
        }
        for (const tabId of options.tabIds) {
          const tab = stateTabs.get(tabId);
          if (tab) tab.groupId = group.id;
        }
        return group.id;
      }
    },
    tabGroups: {
      query: async queryInfo => {
        queries.push(queryInfo);
        return stateGroups
          .filter(group => Object.entries(queryInfo).every(([key, value]) => group[key] === value))
          .map(group => ({ ...group }));
      },
      update: async (groupId, properties) => {
        groupUpdates.push({ groupId, properties });
        const group = stateGroups.find(candidate => candidate.id === groupId);
        if (group) Object.assign(group, properties);
        return group ? { ...group } : undefined;
      }
    },
    windows: {
      onCreated: { addListener: listener => { listeners.windowCreated = listener; } }
    }
  };

  t.after(() => { delete globalThis.chrome; });
  await import(new URL(`./sw.js?case=${caseNumber++}`, import.meta.url).href);
  return { listeners, queries, grouped, groupUpdates, groups: stateGroups, tabs: stateTabs, releaseFirstGroup };
}

test('groups a YouTube tab in the group belonging to the same window', async t => {
  const { listeners, queries, grouped } = await loadServiceWorker(t, {
    tabs: [{ id: 1, windowId: 2, url: 'https://www.youtube.com/watch?v=x', groupId: -1 }],
    groups: [
      { id: 100, title: 'YouTube & Videos', windowId: 1 },
      { id: 200, title: 'YouTube & Videos', windowId: 2 }
    ]
  });

  listeners.created({ id: 1, windowId: 2, url: 'https://www.youtube.com/watch?v=x', groupId: -1 });
  await settle();

  assert.deepEqual(queries, [{ windowId: 2 }]);
  assert.deepEqual(grouped, [{ tabIds: [1], groupId: 200 }]);
});

test('creates a missing group in the tab window instead of using another window group', async t => {
  const { listeners, queries, grouped, groups, tabs } = await loadServiceWorker(t, {
    tabs: [{ id: 2, windowId: 3, url: 'https://www.youtube.com/watch?v=y', groupId: -1 }],
    groups: [{ id: 100, title: 'YouTube & Videos', windowId: 1 }]
  });

  listeners.updated(2, { url: 'https://www.youtube.com/watch?v=y' }, tabs.get(2));
  await settle();

  assert.deepEqual(queries, [{ windowId: 3 }]);
  assert.equal(grouped.length, 1);
  assert.deepEqual(grouped[0].tabIds, [2]);
  assert.equal(grouped[0].groupId, undefined);
  assert.equal(grouped[0].createProperties.windowId, 3);
  assert.equal(groups.length, 2);
  assert.equal(groups[1].title, 'YouTube & Videos');
  assert.equal(groups[1].windowId, 3);
  assert.equal(tabs.get(2).groupId, groups[1].id);
});

test('creates one group for simultaneous matching tabs in the same window', async t => {
  const first = { id: 3, windowId: 4, url: 'https://www.youtube.com/watch?v=a', groupId: -1 };
  const second = { id: 4, windowId: 4, url: 'https://www.youtube.com/watch?v=b', groupId: -1 };
  const { listeners, grouped, groups, tabs } = await loadServiceWorker(t, { tabs: [first, second] });

  listeners.created(tabs.get(3));
  listeners.created(tabs.get(4));
  await settle();

  const created = grouped.filter(call => call.createProperties);
  assert.equal(created.length, 1);
  assert.equal(created[0].createProperties.windowId, 4);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].title, 'YouTube & Videos');
  assert.equal(groups[0].windowId, 4);
  assert.equal(tabs.get(3).groupId, groups[0].id);
  assert.equal(tabs.get(4).groupId, groups[0].id);
});

test('creates a new group after the previous same-window group disappears', async t => {
  const { listeners, grouped, groups, tabs } = await loadServiceWorker(t, {
    tabs: [
      { id: 5, windowId: 5, url: 'https://www.youtube.com/watch?v=first', groupId: -1 },
      { id: 6, windowId: 5, url: 'https://www.youtube.com/watch?v=second', groupId: -1 }
    ]
  });

  listeners.created(tabs.get(5));
  await settle();
  const firstGroupId = groups[0].id;

  groups.length = 0;
  listeners.created(tabs.get(6));
  await settle();

  assert.equal(groups.length, 1);
  assert.notEqual(groups[0].id, firstGroupId);
  assert.equal(grouped.filter(call => call.createProperties).length, 2);
});

test('organizes existing tabs when a new window opens', async t => {
  const { listeners, grouped, groups, tabs } = await loadServiceWorker(t, {
    tabs: [{ id: 7, windowId: 6, url: 'https://github.com/hashem/repo', groupId: -1 }]
  });

  listeners.windowCreated({ id: 6 });
  await settle();

  assert.equal(groups.length, 1);
  assert.equal(groups[0].title, 'GitHub');
  assert.equal(groups[0].windowId, 6);
  assert.equal(tabs.get(7).groupId, groups[0].id);
  assert.equal(grouped.filter(call => call.createProperties).length, 1);
});

test('uses the latest URL when a tab navigates again before the first placement finishes', async t => {
  const tab = { id: 10, windowId: 7, url: 'https://www.youtube.com/', groupId: -1 };
  const { listeners, grouped, groups, tabs, releaseFirstGroup } = await loadServiceWorker(t, {
    tabs: [tab],
    gateFirstGroupCall: true
  });

  listeners.updated(10, { url: 'https://www.youtube.com/' }, tabs.get(10));
  await settle();
  listeners.updated(10, { url: 'https://github.com/hashem/repo' }, tabs.get(10));
  releaseFirstGroup();
  await settle();
  await settle();

  const githubGroup = groups.find(group => group.title === 'GitHub');
  assert.ok(githubGroup);
  assert.equal(githubGroup.windowId, 7);
  assert.equal(tabs.get(10).groupId, githubGroup.id);
  assert.equal(grouped.filter(call => call.tabIds.includes(10)).length >= 2, true);
});

test('lets other tabs create a group when the seed tab fails', async t => {
  const { listeners, grouped, groups, tabs } = await loadServiceWorker(t, {
    tabs: [
      { id: 11, windowId: 8, url: 'https://www.youtube.com/watch?v=seed', groupId: -1 },
      { id: 12, windowId: 8, url: 'https://www.youtube.com/watch?v=waiter', groupId: -1 }
    ],
    failGroupForTabs: new Set([11])
  });

  listeners.created(tabs.get(11));
  listeners.created(tabs.get(12));
  await settle();

  assert.equal(groups.length, 1);
  assert.equal(groups[0].title, 'YouTube & Videos');
  assert.equal(tabs.get(12).groupId, groups[0].id);
  assert.equal(grouped.some(call => call.createProperties && call.tabIds.includes(12)), true);
});

test('handles simultaneous YouTube tabs in separate windows independently', async t => {
  const { listeners, grouped, groups, tabs } = await loadServiceWorker(t, {
    tabs: [
      { id: 8, windowId: 10, url: 'https://www.youtube.com/watch?v=a', groupId: -1 },
      { id: 9, windowId: 20, url: 'https://www.youtube.com/watch?v=b', groupId: -1 }
    ],
    groups: [
      { id: 100, title: 'YouTube & Videos', windowId: 10 },
      { id: 200, title: 'YouTube & Videos', windowId: 20 }
    ]
  });

  listeners.created(tabs.get(8));
  listeners.created(tabs.get(9));
  await settle();

  assert.deepEqual(grouped, [
    { tabIds: [8], groupId: 100 },
    { tabIds: [9], groupId: 200 }
  ]);
});
