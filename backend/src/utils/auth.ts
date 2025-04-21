import crypto from "crypto";

export const genPassword = (password: string): string => {
  const salt = crypto.randomBytes(32).toString("hex");
  const hash = crypto
    .scryptSync(password, salt, 64, { N: 2 ** 14, r: 8, p: 5 })
    .toString("hex");

  return `${hash}.${salt}`;
};

export const validPassword = (
  password: string,
  storedHash: string,
): boolean => {
  if (password.length === 0) return false;

  const [hash, salt] = storedHash.split(".");

  // we need to pass buffer values to timingSafeEqual
  const hashedBuf = Buffer.from(hash, "hex");
  const passwordBuf = crypto.scryptSync(password, salt, 64, {
    N: 2 ** 14,
    r: 8,
    p: 5,
  });

  return crypto.timingSafeEqual(hashedBuf, passwordBuf);
};
