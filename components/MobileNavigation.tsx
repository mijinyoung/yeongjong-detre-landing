"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { openLeadModal, trackEvent } from "@/lib/analytics";
import { useOverlayFocus } from "@/lib/use-overlay-focus";
import { contactHref, projectConfig } from "@/data/project-config";

export default function MobileNavigation() {
  const links = projectConfig.navigation.filter((item) => item.enabled);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useOverlayFocus({
    open,
    containerRef: panelRef,
    initialFocusRef: closeRef,
    onClose: () => setOpen(false),
  });

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

      {mounted && open ? createPortal(
        <div className="mobileNavOverlay" role="presentation" onClick={() => setOpen(false)}>
          <nav
            ref={panelRef}
            id="mobile-navigation-panel"
            className="mobileNavPanel"
            aria-label="모바일 주요 메뉴"
            onClick={(event) => event.stopPropagation()}
            tabIndex={-1}
          >
            <div className="mobileNavHeader">
              <div>
                <strong>{projectConfig.identity.brandPrimary}</strong>
                <span>{projectConfig.identity.brandSecondary}</span>
              </div>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="메뉴 닫기">×</button>
            </div>

            <div className="mobileNavLinks">
              {links.map((item, index) => (
                <a key={item.href} href={item.href} onClick={() => closeAndTrack(item.label)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{item.label}</strong>
                  <i aria-hidden="true">→</i>
                </a>
              ))}
            </div>

            <div className="mobileNavActions">
              <a
                href={contactHref}
                data-placement="mobile-menu"
                onClick={() => closeAndTrack("전화상담")}
              >
                전화상담 {projectConfig.contact.displayPhone}
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
        </div>,
        document.body,
      ) : null}
    </>
  );
}
