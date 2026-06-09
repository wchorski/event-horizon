/**
 * usage
 * const deleteBtn = createElement("button", 
        { className: "delete", textContent: "delete" },
        { action: "delete", type: "block" }
    );
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]>,
  dataset?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const el = Object.assign(document.createElement(tag), props);
  if (dataset) Object.assign(el.dataset, dataset);
  return el;
}