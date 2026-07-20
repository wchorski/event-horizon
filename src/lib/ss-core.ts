// lib/ss-core.ts
export type SerialisedItem = {
  _value: string;
  _primary: string;
  _secondary: string;
  _input: string;
  _meta: string;
  _search: string;
  _raw: Record<string, unknown>;
};

export abstract class SearchSelectBase extends HTMLElement {
  protected cb!: HTMLElement;
  protected input!: HTMLInputElement;
  protected hiddenInput!: HTMLInputElement;
  protected clearBtn!: HTMLButtonElement;
  protected list!: HTMLElement;
  protected hdr!: HTMLElement;
  protected tpl!: {
    option: HTMLTemplateElement;
    empty: HTMLTemplateElement;
    skeleton: HTMLTemplateElement;
  };

  protected results: SerialisedItem[] = [];
  protected selVal = "";
  protected hlIdx = -1;

  connectedCallback() {
    this.cb = this.querySelector(".ss-combobox")!;
    this.input = this.querySelector(".ss-input")!;
    this.hiddenInput = this.querySelector('input[type="hidden"]')!;
    this.clearBtn = this.querySelector(".ss-clear")!;
    this.list = this.querySelector(".ss-list")!;
    this.hdr = this.querySelector(".ss-drop-header")!;
    this.tpl = {
      option: this.querySelector('template[data-tpl="option"]')!,
      empty: this.querySelector('template[data-tpl="empty"]')!,
      skeleton: this.querySelector('template[data-tpl="skeleton"]')!,
    };
    this.selVal = this.dataset.preValue ?? "";
    this.bindSharedEvents();
    this.onConnected();
  }

  disconnectedCallback() {
    document.removeEventListener("mousedown", this.handleClickOutside);
  }

  protected abstract onConnected(): void;
  protected abstract onInput(query: string): void;
  protected onCleared(): void {}
  protected onOpen(): void {}

  protected renderList(items: SerialisedItem[]) {
    this.list.innerHTML = "";
    if (!items.length) {
      this.renderEmpty("No matches found", "Try a different search term");
      return;
    }
    items.forEach((item, i) => {
      const node = this.tpl.option.content.cloneNode(true) as DocumentFragment;
      const el = node.querySelector(".ss-option") as HTMLElement;
      el.dataset.value = item._value;
      if (item._value === this.selVal) el.classList.add("sel");
      if (i === this.hlIdx) el.classList.add("hl");
      node.querySelector(".ss-avatar")!.textContent = this.initials(
        item._primary,
      );
      node.querySelector(".ss-primary")!.textContent = item._primary;
      const sec = node.querySelector(".ss-secondary")!;
      item._secondary ? (sec.textContent = item._secondary) : sec.remove();
      const meta = node.querySelector(".ss-meta")!;
      item._meta ? (meta.textContent = item._meta) : meta.remove();
      this.list.appendChild(node);
    });
  }

  protected renderEmpty(text: string, sub: string) {
    this.list.innerHTML = "";
    const node = this.tpl.empty.content.cloneNode(true) as DocumentFragment;
    node.querySelector(".ss-empty-text")!.textContent = text;
    node.querySelector(".ss-empty-sub")!.textContent = sub;
    this.list.appendChild(node);
  }

  protected renderSkeleton() {
    this.list.innerHTML = "";
    for (let i = 0; i < 5; i++) {
      this.list.appendChild(this.tpl.skeleton.content.cloneNode(true));
    }
  }

  protected initials(text: string) {
    return text
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase();
  }

  select(val: string) {
    const item = this.results.find((i) => i._value === val);
    if (!item) return;
    this.selVal = val;
    this.hiddenInput.value = val;
    // this.input.value = item._input;
    this.input.value = item._primary + ` <${item._secondary}>`;
    this.cb.classList.add("has-value");
    this.input.dataset.locked = "true";
    console.log(this.input);
    this.input.disabled = true;
    this.close();
    this.dispatchEvent(new CustomEvent("ss:change", { detail: item._raw }));
  }

  clear() {
    this.selVal = "";
    this.hiddenInput.value = "";
    this.input.value = "";
    this.cb.classList.remove("has-value");
    this.input.disabled = false;
    delete this.input.dataset.locked;
    this.onCleared();
  }

  protected open() {
    this.cb.classList.add("open");
    this.input.setAttribute("aria-expanded", "true");
    this.onOpen();
  }

  protected close() {
    this.cb.classList.remove("open");
    this.input.setAttribute("aria-expanded", "false");
    this.hlIdx = -1;
  }

  private handleClickOutside = (e: MouseEvent) => {
    if (!this.contains(e.target as Node)) this.close();
  };

  private bindSharedEvents() {
    this.input.addEventListener("focus", () => {
      if (!this.input.hasAttribute("data-locked")) this.open();
    });
    this.input.addEventListener("click", () => {
      if (!this.input.hasAttribute("data-locked")) this.open();
    });
    this.input.addEventListener("input", () => {
      if (!this.cb.classList.contains("open")) this.open();
      this.selVal = "";
      this.hiddenInput.value = "";
      this.onInput(this.input.value.trim());
    });
    this.input.addEventListener("keydown", (e: KeyboardEvent) => {
      if (!this.cb.classList.contains("open")) {
        this.open();
        return;
      }
      if (e.key === "Escape") {
        const hit = this.results.find((i) => i._value === this.selVal);
        this.input.value = hit ? hit._input : "";
        this.close();
      }
      if (e.key === "Tab") this.close();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        const opts = [...this.list.querySelectorAll<HTMLElement>(".ss-option")];
        if (!opts.length) return;
        this.hlIdx =
          e.key === "ArrowDown"
            ? (this.hlIdx + 1) % opts.length
            : (this.hlIdx - 1 + opts.length) % opts.length;
        opts.forEach((o) => o.classList.remove("hl"));
        opts[this.hlIdx].classList.add("hl");
        opts[this.hlIdx].scrollIntoView({ block: "nearest" });
      }
      if (e.key === "Enter") {
        const hl = this.list.querySelector<HTMLElement>(".ss-option.hl");
        if (hl) {
          e.preventDefault();
          this.select(hl.dataset.value!);
        }
      }
    });
    // Delegated on the container — survives htmx swapping .ss-list's innerHTML
    this.list.addEventListener("mousedown", (e) => {
      const opt = (e.target as HTMLElement).closest<HTMLElement>(".ss-option");

      if (opt) {
        e.preventDefault();
        this.select(opt.dataset.value!);
      }
    });
    this.clearBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      this.clear();
    });
    document.addEventListener("mousedown", this.handleClickOutside);
  }
}
