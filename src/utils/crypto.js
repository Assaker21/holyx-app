import {randomBytes, createHash} from 'react-native-quick-crypto';
import 'react-native-get-random-values'; // ensures global.crypto exists

export const CryptoDigestAlgorithm = {SHA256: 'SHA-256'};
export const CryptoEncoding = {HEX: 'HEX'};

export async function digestStringAsync(alg, str, opts = {}) {
  if (alg !== CryptoDigestAlgorithm.SHA256)
    throw new Error(`Unsupported algorithm: ${alg}`);
  const hash = createHash('sha256').update(str).digest();
  return opts.encoding === CryptoEncoding.HEX
    ? hash.toString('hex')
    : hash.toString();
}

export function getRandomBytes(len) {
  // expo-crypto returns Uint8Array; convert Buffer so the signature matches
  return Uint8Array.from(randomBytes(len));
}

export default {
  CryptoDigestAlgorithm,
  CryptoEncoding,
  digestStringAsync,
  getRandomBytes,
};
