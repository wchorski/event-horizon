export function uuidv7() {
  const now = Date.now(); // ms since epoch

  // 48-bit timestamp + 80 bits of randomness
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  // Timestamp: bits 0–47
  bytes[0] = (now / 2 ** 40) & 0xff;
  bytes[1] = (now / 2 ** 32) & 0xff;
  bytes[2] = (now / 2 ** 24) & 0xff;
  bytes[3] = (now / 2 ** 16) & 0xff;
  bytes[4] = (now / 2 ** 8) & 0xff;
  bytes[5] = now & 0xff;

  // Version: top 4 bits of byte 6 = 0b0111 (7)
  bytes[6] = (bytes[6] & 0x0f) | 0x70;

  // Variant: top 2 bits of byte 8 = 0b10
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // Format as UUID string
  return [...bytes]
    .map((b, i) =>
      [4, 6, 8, 10].includes(i)
        ? `-${b.toString(16).padStart(2, "0")}`
        : b.toString(16).padStart(2, "0"),
    )
    .join("");
}
