type StyleWithVars = Partial<CSSStyleDeclaration> & Record<`--${string}`, string>;
/**
 * usage
 * const deleteBtn = createElement("button", 
        { className: "delete", textContent: "delete" },
        { action: "delete", type: "block" }
    );
 */
export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Omit<Partial<HTMLElementTagNameMap[K]>, "style"> & {
    style?: StyleWithVars;
  },
  dataset?: Record<string, string>,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  // assign props EXCEPT style
  const { style, ...rest } = props;
  Object.assign(el, rest);

  // assign style safely
  if (style) {
    for (const [key, value] of Object.entries(style)) {
      if (key.startsWith("--")) {
        el.style.setProperty(key, String(value));
      } else {
        (el.style as any)[key] = value;
      }
    }
  }

  if (dataset) Object.assign(el.dataset, dataset);

  return el;
}
