"use client";

import { RefObject, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const overlayStack: symbol[] = [];
let previousBodyOverflow = "";

type OverlayFocusOptions = {
  open: boolean;
  containerRef: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
};

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      (element.offsetWidth > 0 || element.offsetHeight > 0),
  );
}

export function useOverlayFocus({
  open,
  containerRef,
  initialFocusRef,
  onClose,
}: OverlayFocusOptions) {
  const overlayIdRef = useRef(Symbol("overlay"));
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const overlayId = overlayIdRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (overlayStack.length === 0) {
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    overlayStack.push(overlayId);

    const focusTimer = window.setTimeout(() => {
      const container = containerRef.current;
      const target =
        initialFocusRef?.current ||
        (container ? getFocusableElements(container)[0] : null) ||
        container;
      target?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (overlayStack.at(-1) !== overlayId) return;

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;
      const focusable = getFocusableElements(container);

      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1) || first;
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !container.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown, true);

      const index = overlayStack.lastIndexOf(overlayId);
      if (index >= 0) overlayStack.splice(index, 1);
      if (overlayStack.length === 0) {
        document.body.style.overflow = previousBodyOverflow;
      }

      window.setTimeout(() => {
        if (previouslyFocused?.isConnected) previouslyFocused.focus();
      }, 0);
    };
  }, [containerRef, initialFocusRef, open]);
}
