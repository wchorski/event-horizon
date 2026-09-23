// lib/crypto/secretBox.ts
import { meta } from "astro:schema";
import crypto from "node:crypto";
const { CREDENTIALS_ENCRYPTION_KEY } = import.meta.env;
const MASTER_KEY = Buffer.from(CREDENTIALS_ENCRYPTION_KEY!, "base64"); // 32 bytes

export function encryptSecret(plaintext: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", MASTER_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptSecret(ciphertext: string, iv: string, authTag: string) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    MASTER_KEY,
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
