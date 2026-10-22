import { getPaginationPages } from "./pagination";

const BTN_BASE =
  "rounded-md border border-white/20 px-3 py-1.5 text-sm text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40";

/**
 * Client-side pagination over server-rendered items. `groups` are parallel
 * lists of elements (for example a table's rows and the matching mobile cards)
 * that share the same page index. The nav shell (persistent aria-live status
 * and controls container) is rendered by PaginationControls.astro; without
 * JavaScript the nav stays hidden and every item is visible.
 */
export function initPagination(root: HTMLElement, groups: HTMLElement[][]) {
  const nav = root.querySelector<HTMLElement>("[data-pagination-nav]");
  const status = nav?.querySelector<HTMLElement>("[data-pagination-status]");
  const controls = nav?.querySelector<HTMLElement>("[data-pagination-controls]");
  if (!nav || !status || !controls) return;

  const total = Math.max(0, ...groups.map((group) => group.length));
  const pageSize = Math.max(1, Number(root.dataset.pageSize) || 12);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return;

  let current = 1;

  // focusKey: "prev" | "next" | "page:<n>" - the control to keep focused
  // after a click (the old React component kept focus on the clicked button).
  function render(focusKey?: string) {
    for (const group of groups) {
      group.forEach((item, index) => {
        item.hidden = Math.floor(index / pageSize) + 1 !== current;
      });
    }

    const from = (current - 1) * pageSize + 1;
    const to = Math.min(current * pageSize, total);
    status!.textContent = `顯示第 ${from}–${to} 筆，共 ${total} 筆`;

    const nodes: Node[] = [];
    const addButton = (key: string, text: string, className: string, label: string, page: number, disabled = false, isCurrent = false) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = className;
      button.textContent = text;
      button.setAttribute("aria-label", label);
      if (isCurrent) button.setAttribute("aria-current", "page");
      button.disabled = disabled;
      button.dataset.key = key;
      button.addEventListener("click", () => {
        current = page;
        render(key);
      });
      nodes.push(button);
    };

    addButton("prev", "上一頁", BTN_BASE, `上一頁，共 ${totalPages} 頁`, current - 1, current === 1);

    for (const page of getPaginationPages(current, totalPages)) {
      if (typeof page !== "number") {
        const gap = document.createElement("span");
        gap.setAttribute("aria-hidden", "true");
        gap.className = "px-1 text-gray-400";
        gap.textContent = "…";
        nodes.push(gap);
        continue;
      }
      const isCurrent = page === current;
      addButton(
        `page:${page}`,
        String(page),
        isCurrent
          ? "min-w-9 rounded-md bg-accent px-2.5 py-1.5 text-sm font-semibold text-primary-dark"
          : "min-w-9 rounded-md border border-white/20 px-2.5 py-1.5 text-sm text-gray-200 transition-colors hover:bg-white/10",
        `第 ${page} 頁`,
        page,
        false,
        isCurrent
      );
    }

    addButton("next", "下一頁", BTN_BASE, `下一頁，共 ${totalPages} 頁`, current + 1, current === totalPages);

    controls!.replaceChildren(...nodes);
    nav!.hidden = false;

    if (focusKey) {
      const target = controls!.querySelector<HTMLButtonElement>(`[data-key="${focusKey}"]`);
      // A control that just became disabled cannot hold focus; fall back to
      // the opposite step button so keyboard users stay in the control group.
      const fallback = focusKey === "prev" ? "next" : focusKey === "next" ? "prev" : `page:${current}`;
      (target && !target.disabled ? target : controls!.querySelector<HTMLButtonElement>(`[data-key="${fallback}"]`))?.focus();
    }
  }

  render();
}
