import assert from 'node:assert/strict';
import test from 'node:test';
import { classifyUrl, GROUP_TITLES } from './classify.js';

test('group titles match existing Chrome groups exactly', () => {
  assert.deepEqual(GROUP_TITLES, [
    'AI & ChatGPT',
    'GitHub',
    'YouTube & Videos',
    'Social Media & Messaging',
    'Movies & Anime',
    'Learning & Books',
    'Research & University',
    'Google Tools'
  ]);
});

test('classifies GitHub URLs into the GitHub group', () => {
  assert.equal(classifyUrl('https://github.com/'), 'GitHub');
  assert.equal(classifyUrl('https://gist.github.com/user/repo'), 'GitHub');
});

test('classifies representative URLs from every group', () => {
  assert.equal(classifyUrl('https://chatgpt.com/c/abc'), 'AI & ChatGPT');
  assert.equal(classifyUrl('https://WWW.YOUTUBE.COM/watch?v=x'), 'YouTube & Videos');
  assert.equal(classifyUrl('https://youtu.be/x'), 'YouTube & Videos');
  assert.equal(classifyUrl('https://web.whatsapp.com/'), 'Social Media & Messaging');
  assert.equal(classifyUrl('https://x.com/RMCFarab'), 'Social Media & Messaging');
  assert.equal(classifyUrl('https://www.netflix.com/watch/81761732'), 'Movies & Anime');
  assert.equal(classifyUrl('https://moviztime.site/series/x'), 'Movies & Anime');
  assert.equal(classifyUrl('https://terenglish.com/'), 'Learning & Books');
  assert.equal(classifyUrl('https://atirbooks.com/books/x'), 'Learning & Books');
  assert.equal(classifyUrl('https://app.notion.com/p/x'), 'Research & University');
  assert.equal(classifyUrl('https://www.overleaf.com/register'), 'Research & University');
  assert.equal(classifyUrl('https://translate.google.com/?sl=en'), 'Google Tools');
  assert.equal(classifyUrl('https://docs.google.com/document/d/x'), 'Google Tools');
});

test('leaves unknown and lookalike domains ungrouped', () => {
  assert.equal(classifyUrl('https://example.com/'), null);
  assert.equal(classifyUrl('https://netflix.com.evil.test/'), null);
  assert.equal(classifyUrl('https://not-netflix.com/'), null);
  assert.equal(classifyUrl('https://github.com.evil.test/'), null);
  assert.equal(classifyUrl('https://not-github.com/'), null);
});
