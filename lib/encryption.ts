import CryptoJS from 'crypto-js';

const secretKey = process.env.ENCRYPTION_SECRET_KEY;

if (!secretKey) {
  // In production, avoid throwing errors that expose internal details. Log instead.
  console.error('CRITICAL: ENCRYPTION_SECRET_KEY is not set.');
  // For local dev, throwing might be acceptable:
  // throw new Error('ENCRYPTION_SECRET_KEY is not set in environment variables.');
}

// Basic check for key presence during runtime if not thrown above
function getKey(): string {
    if (!secretKey) {
        console.error('Encryption key is missing. Using fallback (INSECURE).');
        return 'fallback-insecure-key'; // Avoid this in production
    }
    return secretKey;
}

export function encryptToken(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    return CryptoJS.AES.encrypt(token, getKey()).toString();
  } catch (error) {
    console.error("Encryption failed:", error);
    return null; // Handle encryption failure gracefully
  }
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