export function uuidv7() {
  const now = BigInt(Date.now()); // ms since epoch

  const bytes = new Uint8Array(16);

  // --- 48-bit timestamp (big-endian) ---
  bytes[0] = Number((now >> 40n) & 0xffn);
  bytes[1] = Number((now >> 32n) & 0xffn);
  bytes[2] = Number((now >> 24n) & 0xffn);
  bytes[3] = Number((now >> 16n) & 0xffn);
  bytes[4] = Number((now >> 8n) & 0xffn);
  bytes[5] = Number(now & 0xffn);

  // --- 80 bits random ---
  crypto.getRandomValues(bytes.subarray(6));

  // --- version (7) ---
  bytes[6] = (bytes[6] & 0x0f) | 0x70;

  // --- variant (RFC 4122) ---
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // --- format ---
  return (
    toHex(bytes.subarray(0, 4)) + "-" +
    toHex(bytes.subarray(4, 6)) + "-" +
    toHex(bytes.subarray(6, 8)) + "-" +
    toHex(bytes.subarray(8, 10)) + "-" +
    toHex(bytes.subarray(10))
  );
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
}