import type { KeyboardEvent, MouseEvent } from "react";

function isElement(target: EventTarget | null): target is Element {
  return target instanceof Element;
}

export function isInteractiveRowTarget(target: EventTarget | null) {
  return isElement(target) && Boolean(target.closest("a, button, input, select, textarea, label, summary, [role='button'], [role='link']"));
}

export function openTableRowDestination(href: string, navigate: (to: string) => void) {
  if (href.startsWith("/")) {
    navigate(href);
    return;
  }

  window.open(href, "_blank", "noopener,noreferrer");
}

export function handleTableRowClick(
  event: MouseEvent<HTMLElement>,
  href: string | null | undefined,
  navigate: (to: string) => void
) {
  if (!href || event.button !== 0 || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
    return;
  }

  if (isInteractiveRowTarget(event.target)) {
    return;
  }

  openTableRowDestination(href, navigate);
}

export function handleTableRowKeyDown(
  event: KeyboardEvent<HTMLElement>,
  href: string | null | undefined,
  navigate: (to: string) => void
) {
  if (!href || event.defaultPrevented || isInteractiveRowTarget(event.target)) {
    return;
  }

  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  event.preventDefault();
  openTableRowDestination(href, navigate);
}
