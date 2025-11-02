import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt) as (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
  keylen: number,
  options?: crypto.ScryptOptions
) => Promise<Buffer>;

type ScryptParams = {
  N: number;
  r: number;
  p: number;
  keyLen: number;
};

const DEFAULT_PARAMS: ScryptParams = {
  N: 2 ** 14,
  r: 8,
  p: 5,
  keyLen: 64
};

const ALGORITHM_ID = 'scrypt';

function encodeParams(p: ScryptParams) {
  return `N=${p.N}$r=${p.r}$p=${p.p}$keylen=${p.keyLen}`;
}

function parseStoredHash(stored: string) {
  const parts = stored.split('$');
  if (parts.length !== 7) return null;
  const [algo, Npart, rpart, ppart, keylenPart, saltHex, hashHex] = parts;
  if (algo !== ALGORITHM_ID) return null;

  const getVal = (s: string) => Number(s.split('=')[1]);
  const N = getVal(Npart);
  const r = getVal(rpart);
  const p = getVal(ppart);
  const keyLen = getVal(keylenPart);

  if (!saltHex || !hashHex) return null;

  return {
    params: { N, r, p, keyLen },
    saltHex,
    hashHex
  } as { params: ScryptParams; saltHex: string; hashHex: string };
}

/**
 * Hash a password using scrypt.
 */
export async function hashPassword(password: string, params: ScryptParams = DEFAULT_PARAMS): Promise<string> {
  if (!password) throw new Error('Password must be a non-empty string');

  const salt = crypto.randomBytes(32).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, params.keyLen, {
    N: params.N,
    r: params.r,
    p: params.p
  })) as Buffer;

  const hashHex = derivedKey.toString('hex');
  return `${ALGORITHM_ID}$${encodeParams(params)}$${salt}$${hashHex}`;
}

/**
 * Verify a password against a stored hash.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!password) return false;

  const parsed = parseStoredHash(stored);
  if (!parsed) return false;

  const { params, saltHex, hashHex } = parsed;
  const derivedKey = (await scryptAsync(password, saltHex, params.keyLen, {
    N: params.N,
    r: params.r,
    p: params.p
  })) as Buffer;

  const storedBuf = Buffer.from(hashHex, 'hex');
  if (storedBuf.length !== derivedKey.length) return false;

  return crypto.timingSafeEqual(storedBuf, derivedKey);
}

/**
 * Check if a stored hash is using outdated parameters.
 */
export function needsRehash(stored: string, target: ScryptParams = DEFAULT_PARAMS): boolean {
  const parsed = parseStoredHash(stored);
  if (!parsed) return true;
  const { params } = parsed;
  return (
    params.N !== target.N || params.r !== target.r || params.p !== target.p || params.keyLen !== target.keyLen
  );
}
