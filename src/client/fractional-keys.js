// fractional-key.js
const BASE_62 =
  "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generates a string key that sorts strictly between `before` and `after`.
 * Pass null for either end to mean "no bound" (start/end of a list).
 */
export function generateKeyBetween(before, after) {
  before = before || "";
  after = after || "";

  let result = "";
  let i = 0;

  while (true) {
    const a = before[i];
    const b = after[i];

    // Both strings exhausted with no divergence found — this means
    // there's no upper bound constraining us at this depth (e.g. before
    // ends in the maximum character and after is open-ended). Stop
    // here and extend the key by one more character instead of looping
    // forever comparing undefined === undefined.
    if (a === undefined && b === undefined) {
      const aCode = 0;
      const bCode = BASE_62.length;
      result += BASE_62[Math.floor((aCode + bCode) / 2)];
      return result;
    }

    if (a === b) {
      // same defined character at this position — carry it over, go deeper
      result += a;
      i++;
      continue;
    }

    const aCode = a ? BASE_62.indexOf(a) : 0;
    const bCode = b !== undefined ? BASE_62.indexOf(b) : BASE_62.length;

    if (bCode - aCode > 1) {
      result += BASE_62[Math.floor((aCode + bCode) / 2)];
      return result;
    }

    // no room between a and b at this position — take the lower char
    // (or the floor if `before` is exhausted) and look deeper
    result += a || BASE_62[0];
    i++;
  }
}