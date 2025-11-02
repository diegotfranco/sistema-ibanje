import crypto from 'crypto';
import { promisify } from 'util';
import fs from 'fs';
import readline from 'readline';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const scryptAsync = promisify(crypto.scrypt);

const DEFAULT_PARAMS = {
  N: 2 ** 14,
  r: 8,
  p: 5,
  keyLen: 64
};

const ALGORITHM_ID = 'scrypt';

function encodeParams(p) {
  return `N=${p.N}$r=${p.r}$p=${p.p}$keylen=${p.keyLen}`;
}

async function hashPassword(password, params = DEFAULT_PARAMS) {
  if (!password) throw new Error('Password must be a non-empty string');

  const salt = crypto.randomBytes(32).toString('hex');
  const derivedKey = await scryptAsync(password, salt, params.keyLen, {
    N: params.N,
    r: params.r,
    p: params.p
  });

  const hashHex = derivedKey.toString('hex');
  return `${ALGORITHM_ID}$${encodeParams(params)}$${salt}$${hashHex}`;
}

async function genHash(password) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const hashString = await hashPassword(password);

  fs.appendFileSync(`${__dirname}/hashs.txt`, `senha ${password}: ${hashString}\n\n`);
  console.log(`✅ Generated hash for ${password}: ${hashString}`);
  return hashString;
}

async function processLineByLine() {
  const args = process.argv.slice(2);

  if (args.length > 0) {
    for (const val of args) {
      await genHash(val);
    }
  } else {
    const fileStream = fs.createReadStream('senhas.txt');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      if (line.trim()) await genHash(line.trim());
    }
  }
}

await processLineByLine();
