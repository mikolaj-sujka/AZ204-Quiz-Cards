#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let raw = '';
process.stdin.on('data', (chunk) => {
  raw += chunk;
});
process.stdin.on('end', () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  const filePath = payload?.tool_input?.file_path ?? payload?.tool_response?.filePath;
  if (!filePath) return;

  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(projectRoot + path.sep)) return;

  spawnSync(`npx --no-install prettier --write "${resolved}"`, {
    cwd: projectRoot,
    stdio: 'ignore',
    shell: true
  });
});
