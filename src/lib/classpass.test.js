import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseClassPassLink, studioHandoff, studioLabel, CLASSPASS_SEARCH } from './classpass.js';

describe('parseClassPassLink', () => {
  it('takes a plain studio link', () => {
    assert.equal(
      parseClassPassLink('https://classpass.com/studios/hot-studio-springfield'),
      'https://classpass.com/studios/hot-studio-springfield',
    );
  });
  it('pulls the link out of share text and drops trailing punctuation', () => {
    assert.equal(
      parseClassPassLink('Check out Hot Studio on ClassPass! https://classpass.com/studios/hot-studio-springfield.'),
      'https://classpass.com/studios/hot-studio-springfield',
    );
  });
  it('accepts the app share short links', () => {
    assert.equal(parseClassPassLink('https://classpass.app.link/abc123'), 'https://classpass.app.link/abc123');
  });
  it('refuses other sites, look-alikes and plain http', () => {
    assert.equal(parseClassPassLink('https://example.com/studios/x'), null);
    assert.equal(parseClassPassLink('https://classpass.com.evil.test/x'), null);
    assert.equal(parseClassPassLink('http://classpass.com/studios/x'), null);
    assert.equal(parseClassPassLink(''), null);
    assert.equal(parseClassPassLink(undefined), null);
  });
});

describe('studioHandoff', () => {
  it('opens the studio page when there is one', () => {
    const s = { name: 'Hot Studio', town: 'Springfield', link: 'https://classpass.com/studios/hot-studio-springfield' };
    assert.deepEqual(studioHandoff(s), { href: s.link, copy: null });
  });
  it('otherwise opens search with name and town to paste', () => {
    assert.deepEqual(studioHandoff({ name: ' Hot Studio ', town: 'Springfield' }), { href: CLASSPASS_SEARCH, copy: 'Hot Studio Springfield' });
    assert.deepEqual(studioHandoff({ name: 'Hot Studio', town: '' }), { href: CLASSPASS_SEARCH, copy: 'Hot Studio' });
  });
});

describe('studioLabel', () => {
  it('joins name and town', () => {
    assert.equal(studioLabel({ name: 'Hot Studio', town: 'Springfield' }), 'Hot Studio, Springfield');
    assert.equal(studioLabel({ name: 'Hot Studio' }), 'Hot Studio');
  });
});
