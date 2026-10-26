#!/usr/bin/env node
// Is the deploy actually live? Fetches a URL and looks for a build identifier.
//
//   node scripts/check-live.mjs https://example.app                 # expects <meta name="build" content="<git sha>">
//   node scripts/check-live.mjs https://example.app abc1234          # expects this exact id
//   node scripts/check-live.mjs https://example.app/app.js --etag    # prints the etag for manual comparison
//
// Exit 0 = the expected id is present; 1 = not present or unreachable.
// Exists because "CI green" was treated as "users have it" while production
// served a ten-day-old build.

import { execSync } from 'node:child_process';

const [url, arg2, arg3] = process.argv.slice(2);
if (!url) { console.error('usage: check-live <url> [expected-id|--etag]'); process.exit(1); }

const wantEtag = arg2 === '--etag' || arg3 === '--etag';
let expected = arg2 && arg2 !== '--etag' ? arg2 : null;
if (!expected && !wantEtag) {
  try { expected = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* not in a repo */ }
}

const res = await fetch(url, { cache: 'no-store', headers: { 'cache-control': 'no-cache' } });
if (!res.ok) { console.error(`✗ ${url} → HTTP ${res.status}`); process.exit(1); }
if (wantEtag) { console.log(`etag: ${res.headers.get('etag') ?? '(none)'}`); process.exit(0); }

const body = await res.text();
const meta = body.match(/<meta\s+name=["']build["']\s+content=["']([^"']+)["']/i)?.[1];
const found = meta ?? (body.includes(expected) ? expected : null);

if (found && (!expected || found.startsWith(expected) || expected.startsWith(found))) {
  console.log(`✓ live: ${url} serves build ${found}`);
  process.exit(0);
}
console.error(`✗ ${url} serves build ${meta ?? '(no build meta)'}; expected ${expected}`);
process.exit(1);
