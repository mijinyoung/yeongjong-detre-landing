"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

const DEPTHS = [25, 50, 75, 90] as const;

export default function ConversionTracker() {
  useEffect(() => {
    const reached = new Set<number>();

    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;
      const depth = Math.round((window.scrollY / scrollable) * 100);

      DEPTHS.forEach((mark) => {
        if (depth >= mark && !reached.has(mark)) {
          reached.add(mark);
          trackEvent("scroll_depth", { percent: mark });
        }
      });
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as Element | null;
      const link = target?.closest("a");
      if (!link) return;
      const href = link.getAttribute("href") || "";
      if (href.startsWith("tel:")) {
        trackEvent("phone_click", {
          placement: link.getAttribute("data-placement") || link.className || "unknown",
          phone: href.replace("tel:", ""),
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
