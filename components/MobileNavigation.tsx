"use client";

import { useEffect, useState } from "react";
import { openLeadModal, trackEvent } from "@/lib/analytics";

const links = [
  ["핵심가치", "#why-now"],
  ["사업개요", "#business-overview"],
  ["입지환경", "#location-v3"],
  ["공식자료", "#official-materials"],
  ["커뮤니티", "#community"],
  ["평면안내", "#floor-plans"],
  ["FAQ", "#faq"],
] as const;

export default function MobileNavigation() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle("mobileNavOpen", open);
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.classList.remove("mobileNavOpen");
      window.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const closeAndTrack = (label: string) => {
    trackEvent("mobile_nav_click", { label });
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className="mobileNavToggle"
        aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
        aria-expanded={open}
        aria-controls="mobile-navigation-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="mobileNavOverlay" role="presentation" onClick={() => setOpen(false)}>
          <nav
            id="mobile-navigation-panel"
            className="mobileNavPanel"
            aria-label="모바일 주요 메뉴"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobileNavHeader">
              <div>
                <strong>DÉTRE</strong>
                <span>LA MER</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="메뉴 닫기">×</button>
            </div>

            <div className="mobileNavLinks">
              {links.map(([label, href], index) => (
                <a key={href} href={href} onClick={() => closeAndTrack(label)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{label}</strong>
                  <i aria-hidden="true">→</i>
                </a>
              ))}
            </div>

            <div className="mobileNavActions">
              <a
                href="tel:18338384"
                data-placement="mobile-menu"
                onClick={() => closeAndTrack("전화상담")}
              >
                전화상담 1833-8384
              </a>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  openLeadModal("mobile-menu");
                }}
              >
                관심고객 등록
              </button>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
