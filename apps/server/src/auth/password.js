import argon2 from "argon2";

/** @param {string} plain @returns {Promise<string>} */
export function hashPassword(plain) {
  return argon2.hash(plain, { type: argon2.argon2id });
}

/** @param {string} hash @param {string} plain @returns {Promise<boolean>} */
export function verifyPassword(hash, plain) {
  return argon2.verify(hash, plain);
}
