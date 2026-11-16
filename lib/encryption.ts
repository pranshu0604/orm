import CryptoJS from 'crypto-js';

function getKey(): string {
  const secretKey = process.env.ENCRYPTION_SECRET_KEY;
  if (!secretKey) throw new Error('Token encryption is not configured.');
  return secretKey;
}

export function encryptToken(token: string | null | undefined): string | null {
  if (!token) return null;
  return CryptoJS.AES.encrypt(token, getKey()).toString();
}

export function decryptToken(encryptedToken: string | null | undefined): string | null {
  if (!encryptedToken) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, getKey());
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null; // Return null if decryption results in empty string
  } catch (error) {
    console.error("Decryption failed:", error);
    return null; // Handle decryption failure gracefully
  }
}