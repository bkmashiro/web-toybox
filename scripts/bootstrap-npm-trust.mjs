import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import {
  discoverPackages,
} from './release-packages.mjs';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', code => resolve(code ?? 1));
  });
}

function runCapture(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    child.on('error', reject);
    child.on('close', code => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

export async function registryHasPackage(name) {
  const result = await runCapture('npm', ['view', name, 'name', '--json']);
  if (result.code === 0) {
    if (!result.stdout.trim()) return false;
    try {
      const value = JSON.parse(result.stdout);
      if (value === name) return true;
      if (Array.isArray(value)) return value.includes(name) || value.some(item => item?.name === name);
      return value?.name === name;
    } catch {
      return result.stdout.replaceAll('"', '').trim() === name;
    }
  }
  if (/E404|404 Not Found|is not in this registry/i.test(`${result.stdout}\n${result.stderr}`)) return false;
  throw new Error(`npm view failed for ${name}: ${result.stderr.trim()}`);
}

export async function planBootstraps(packages, exists) {
  const plan = [];
  for (const pkg of packages) {
    if (!await exists(pkg.name)) plan.push(pkg);
  }
  return plan;
}

export function bootstrapCommands(pkg, includePublish = true) {
  const commands = [];
  if (includePublish) commands.push({
      command: 'npm',
      args: ['publish', '--access', 'public', '--provenance=false'],
      cwd: pkg.directory,
    });
  commands.push({
      command: 'npm',
      args: [
        'trust',
        'github',
        pkg.name,
        '--file',
        'release.yml',
        '--repo',
        'bkmashiro/web-toybox',
        '--allow-publish',
        '--yes',
      ],
    });
  return commands;
}

async function ensureLogin() {
  if (await run('npm', ['whoami']) === 0) return;
  console.log('npm login is required once for bootstrap.');
  if (await run('npm', ['login']) !== 0) throw new Error('npm login failed');
}

async function main() {
  const execute = process.argv.includes('--execute');
  const trustExisting = process.argv.includes('--trust-existing');
  if (execute && (!process.stdin.isTTY || process.env.CI === 'true')) {
    throw new Error('--execute requires an interactive local terminal');
  }

  const root = new URL('..', import.meta.url).pathname;
  const packages = await discoverPackages(root);
  const missing = await planBootstraps(packages, registryHasPackage);
  const targets = trustExisting ? packages : missing;

  if (!targets.length) {
    console.log('No new npm package records need bootstrap. Use --trust-existing only to repair trust configuration.');
    return;
  }

  for (const pkg of targets) {
    const includePublish = missing.includes(pkg);
    console.log(`${includePublish ? 'bootstrap' : 'repair-trust'}\t${pkg.name}@${pkg.version}`);
    for (const step of bootstrapCommands(pkg, includePublish)) {
      console.log(`  ${step.command} ${step.args.join(' ')}`);
    }
  }

  if (!execute) {
    console.log(`dry-run: ${targets.length} package(s); rerun with --execute`);
    return;
  }

  await ensureLogin();
  for (const pkg of targets) {
    const includePublish = missing.includes(pkg);
    for (const step of bootstrapCommands(pkg, includePublish)) {
      const code = await run(step.command, step.args, { cwd: step.cwd });
      if (code !== 0) throw new Error(`${step.command} failed for ${pkg.name}`);
    }
    await sleep(2000);
  }
  console.log(`bootstrapped ${targets.length} package(s)`);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
