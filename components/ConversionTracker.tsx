"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

const DEPTHS = [25, 50, 75, 90] as const;
const SECTION_IDS = [
  "why-now",
  "location-v3",
  "business-overview",
  "official-materials",
  "community",
  "floor-plans",
  "faq",
] as const;

export default function ConversionTracker() {
  useEffect(() => {
    const reachedDepths = new Set<number>();
    const reachedSections = new Set<string>();
    const startedAt = Date.now();

    const onScroll = () => {
      const scrollable =
        document.documentElement.scrollHeight -
        window.innerHeight;

      if (scrollable <= 0) return;

      const depth = Math.round(
        (window.scrollY / scrollable) * 100,
      );

      DEPTHS.forEach((mark) => {
        if (depth >= mark && !reachedDepths.has(mark)) {
          reachedDepths.add(mark);
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
          placement:
            link.getAttribute("data-placement") ||
            link.className ||
            "unknown",
        });
      }

      if (href.startsWith("#")) {
        trackEvent("navigation_click", {
          target_section: href.slice(1),
        });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;

          if (
            entry.isIntersecting &&
            id &&
            !reachedSections.has(id)
          ) {
            reachedSections.add(id);
            trackEvent("section_view", {
              section_id: id,
            });
          }
        });
      },
      {
        threshold: 0.35,
      },
    );

    SECTION_IDS.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });

    const onVisibilityChange = () => {
      if (document.visibilityState !== "hidden") return;

      const seconds = Math.max(
        1,
        Math.round((Date.now() - startedAt) / 1000),
      );

      trackEvent("engaged_time", {
        seconds: Math.min(seconds, 1800),
      });
    };

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });
    document.addEventListener("click", onClick);
    document.addEventListener(
      "visibilitychange",
      onVisibilityChange,
    );

    onScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange,
      );
    };
  }, []);

  return null;
}
