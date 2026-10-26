// `cap sync ios` run on Windows writes the plugin paths in
// ios/App/CapApp-SPM/Package.swift with backslashes, which Swift Package
// Manager on the Mac can't resolve. Runs after every sync (see build:native);
// on the Mac the paths are already forward slashes and this changes nothing.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'ios', 'App', 'CapApp-SPM', 'Package.swift');
if (!existsSync(file)) process.exit(0);

const before = readFileSync(file, 'utf8');
const after = before.replace(/path: "([^"]*)"/g, (_, p) => `path: "${p.replaceAll('\\', '/')}"`);
if (after !== before) {
  writeFileSync(file, after);
  console.log('fix-spm-paths: Package.swift plugin paths normalised to forward slashes');
}
