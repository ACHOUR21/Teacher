#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(path.join(root, 'src'), path.join(dist, 'src'), { recursive: true });

console.log('Build complete: dist/src');
