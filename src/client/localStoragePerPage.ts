export function localStoragePerPage({
  storageKey = "table:perPage",
  allowed = [5, 10, 15, 25, 50, 100],
}: {
  storageKey?: string;
  allowed?: number[];
}) {
  const params = new URLSearchParams(window.location.search);
  const urlValue = params.get("perPage");

  // ✅ User explicitly chose a value → persist it
  if (urlValue !== null) {
    const n = Number(urlValue);
    if (allowed.includes(n)) {
      localStorage.setItem(storageKey, urlValue);
    }
    return;
  }

  // ✅ No perPage in URL → restore once
  const stored = localStorage.getItem(storageKey);
  if (stored) {
    const n = Number(stored);
    if (allowed.includes(n)) {
      params.set("perPage", stored);
      // params.set("page", "1");
      window.location.replace(`${location.pathname}?${params.toString()}`);
    }
  }
}
