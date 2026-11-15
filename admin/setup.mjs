#!/usr/bin/env node
// Sets the dashboard's secrets in Cloudflare. Run from this folder.
//
//   node setup.mjs             first time: makes a new secret link, asks for a password,
//                              uploads everything and prints the link
//   node setup.mjs password    changes only the password (signs everyone out)
//   node setup.mjs link        makes a new secret link (the old one stops working)
//   node setup.mjs --local     same, but writes .dev.vars for `npx wrangler dev` instead of uploading
//
// The password is typed here, hashed on this computer, and only the hash leaves it.
import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const WORKER_URL = 'https://hq.evoxelmusic.com';
const CODE_LENGTH = 10;
// letters and digits that can't be mixed up when typed (no 0/O, 1/l/I)
const CODE_ALPHABET = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ITERATIONS = 100000;          // the most Cloudflare Workers allow for PBKDF2
const MIN_LENGTH = 10;

const args = process.argv.slice(2);
const local = args.includes('--local');
const mode = args.find((a) => !a.startsWith('--')) || 'all';

const b64u = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// a random code of `length` characters from CODE_ALPHABET
function randomCode(length) {
  let code = '';
  while (code.length < length) {
    const b = randomBytes(1)[0];
    if (b < 256 - (256 % CODE_ALPHABET.length)) code += CODE_ALPHABET[b % CODE_ALPHABET.length];   // no bias
  }
  return code;
}

// reads a line without showing what is typed (raw mode, so nothing is echoed)
function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    if (!stdin.isTTY) { console.error('Run this in a terminal so the password stays hidden.'); process.exit(1); }
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          if (!value) continue;            // a stray Enter (e.g. left over from starting the script) is ignored
          stdin.setRawMode(false); stdin.pause(); stdin.off('data', onData);
          process.stdout.write('\n');
          return resolve(value);
        }
        if (ch === '\u0003') { stdin.setRawMode(false); process.stdout.write('\n'); process.exit(1); }   // Ctrl-C
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);                                 // Backspace
        else if (ch >= ' ') value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

async function passwordHash() {
  let first, again;
  for (;;) {
    first = await askHidden(`New dashboard password (at least ${MIN_LENGTH} characters, hidden while you type): `);
    if (first.length < MIN_LENGTH) { console.log(`That was ${first.length} characters. It needs at least ${MIN_LENGTH}. Try again.`); continue; }
    again = await askHidden('Type it again: ');
    if (first === again) break;
    console.log('The two passwords are different. Try again.');
  }
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(first, salt, ITERATIONS, 32, 'sha256');
  return `pbkdf2-sha256$${ITERATIONS}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

function upload(name, value) {
  if (local) return;
  const r = spawnSync('npx', ['wrangler', 'secret', 'put', name], { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
  if (r.status !== 0) { console.error(`Could not upload ${name}.`); process.exit(1); }
}

function writeDevVars(values) {
  const file = '.dev.vars';
  const current = existsSync(file) ? Object.fromEntries(readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1)])) : {};
  Object.assign(current, values);
  writeFileSync(file, Object.entries(current).map(([k, v]) => `${k}=${v}`).join('\n') + '\n', { mode: 0o600 });
}

const values = {};
if (mode === 'all' || mode === 'link') {
  values.DASH_PATH = randomCode(CODE_LENGTH);        // 10 characters from 57, about 58 random bits
  values.DASH_SESSION_KEY = b64u(randomBytes(32));
}
if (mode === 'all' || mode === 'password') values.DASH_PASSWORD_HASH = await passwordHash();
if (!Object.keys(values).length) { console.error('Unknown option. Use: node setup.mjs [password|link] [--local]'); process.exit(1); }

if (local) writeDevVars(values);
for (const [k, v] of Object.entries(values)) upload(k, v);

if (values.DASH_PATH) {
  const base = local ? 'http://localhost:8787' : WORKER_URL;
  console.log('\nYour private dashboard link (keep it to yourself, it is not shown again):');
  console.log(`  ${base}/${values.DASH_PATH}/\n`);
} else {
  console.log('\nPassword changed. Everyone signed in has been signed out.');
}
