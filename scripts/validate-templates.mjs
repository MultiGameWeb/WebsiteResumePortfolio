#!/usr/bin/env node
// Validates the website template catalogue so a small mistake cannot break every template page.
//
// Checks:
//  1. core/registry.js parses and defines window.SITECRAFT_TEMPLATES (catches a missing comma).
//  2. Every registered template has a unique id and its manifest, module and style files exist.
//  3. Every templates/<id>/ folder is registered.
//  4. Each template.json is valid JSON with features and demoData.
//  5. Each template.js imports cleanly and render(demoData, allFeatures) returns HTML with one <h1>.
//
// Usage: node scripts/validate-templates.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const errors = [];
const fail = (msg) => errors.push(msg);

// 1. Registry
let templates = [];
try {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'core/registry.js'), 'utf8'), sandbox, { filename: 'core/registry.js' });
  templates = sandbox.window.SITECRAFT_TEMPLATES;
  if (!Array.isArray(templates) || !templates.length) fail('core/registry.js: window.SITECRAFT_TEMPLATES is missing or empty');
} catch (e) {
  fail('core/registry.js does not parse: ' + e.message);
}

// 2 + 3. Files and folders
const seen = new Set();
for (const t of templates || []) {
  if (!t || !t.id) { fail('registry entry without an id'); continue; }
  if (seen.has(t.id)) fail(`duplicate template id "${t.id}" in core/registry.js`);
  seen.add(t.id);
  for (const key of ['manifest', 'module', 'style']) {
    if (!t[key]) fail(`${t.id}: registry entry has no "${key}"`);
    else if (!fs.existsSync(path.join(root, t[key]))) fail(`${t.id}: ${key} file not found: ${t[key]}`);
  }
}
const folders = fs.readdirSync(path.join(root, 'templates'), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);
if (seen.size) for (const f of folders) if (!seen.has(f)) fail(`templates/${f}/ exists but is not registered in core/registry.js`);

// 4 + 5. Manifest and render smoke test
for (const t of templates || []) {
  if (!t || !t.manifest || !t.module) continue;
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(path.join(root, t.manifest), 'utf8'));
  } catch (e) { fail(`${t.id}: ${t.manifest} is not valid JSON: ${e.message}`); continue; }
  if (!Array.isArray(manifest.features)) fail(`${t.id}: manifest has no features list`);
  if (!manifest.demoData || typeof manifest.demoData !== 'object') fail(`${t.id}: manifest has no demoData`);
  try {
    const mod = await import(pathToFileURL(path.join(root, t.module)).href);
    if (typeof mod.render !== 'function') { fail(`${t.id}: ${t.module} does not export render()`); continue; }
    const html = mod.render(structuredClone(manifest.demoData || {}), (manifest.features || []).map(f => f.id));
    if (typeof html !== 'string' || !html.includes('<')) fail(`${t.id}: render() did not return HTML`);
    else {
      const h1 = (html.match(/<h1[\s>]/g) || []).length;
      if (h1 !== 1) fail(`${t.id}: render() produced ${h1} <h1> elements (expected 1)`);
    }
  } catch (e) { fail(`${t.id}: ${t.module} failed to import or render: ${e.message}`); }
}

if (errors.length) {
  console.error(`Template validation failed (${errors.length} problem${errors.length > 1 ? 's' : ''}):`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
console.log(`✓ ${templates.length} templates registered, all files present, manifests valid and render() works.`);
