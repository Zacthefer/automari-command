// No look-alike characters (0/O, 1/l/I) so a password read aloud or retyped still works
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generatePassword(length = 16): string {
  // Drop bytes above the largest multiple of the alphabet size, so every character is equally likely
  const limit = 256 - (256 % ALPHABET.length);
  let password = "";
  while (password.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
      if (byte < limit && password.length < length) password += ALPHABET[byte % ALPHABET.length];
    }
  }
  return password;
}
