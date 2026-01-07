#!/usr/bin/env node

/**
 * Post-build script for NOX Handle SDK
 * Creates package.json in dist/cjs/ to enable CommonJS support
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const cjsDir = join(process.cwd(), 'dist', 'cjs');
const cjsPackageJson = {
  type: 'commonjs',
};

// Ensure directory exists
mkdirSync(cjsDir, { recursive: true });

// Write package.json for CommonJS support
writeFileSync(
  join(cjsDir, 'package.json'),
  JSON.stringify(cjsPackageJson, null, 2) + '\n'
);

console.log('✓ Created dist/cjs/package.json for CommonJS support');

