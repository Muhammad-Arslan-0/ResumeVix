// Lightweight Web Crypto AES-GCM obfuscation for client-side BYOK keys in localStorage

const SALT_KEY = 'rv-device-secret-v1';

async function getAesKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return null;
  let rawSecret = localStorage.getItem(SALT_KEY);
  if (!rawSecret) {
    const bytes = new Uint8Array(32);
    window.crypto.getRandomValues(bytes);
    rawSecret = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem(SALT_KEY, rawSecret);
  }
  const keyBytes = new Uint8Array(
    rawSecret.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  return window.crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encryptApiKey(plain: string): Promise<string> {
  if (!plain) return '';
  const key = await getAesKey();
  if (!key) return plain;
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plain);
  const cipher = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + cipher.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipher), iv.length);
  return `enc:${btoa(String.fromCharCode(...combined))}`;
}

export async function decryptApiKey(stored: string): Promise<string> {
  if (!stored.startsWith('enc:')) return stored;
  const key = await getAesKey();
  if (!key) return '';
  try {
    const bytes = Uint8Array.from(atob(stored.slice(4)), (c) => c.charCodeAt(0));
    const iv = bytes.slice(0, 12);
    const data = bytes.slice(12);
    const plain = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
    return new TextDecoder().decode(plain);
  } catch {
    return '';
  }
}
