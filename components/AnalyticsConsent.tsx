"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  setAnalyticsConsent,
} from "@/lib/analytics";
import { useOverlayFocus } from "@/lib/use-overlay-focus";

export default function AnalyticsConsentManager() {
  const consent = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener(ANALYTICS_CONSENT_EVENT, onStoreChange);
      return () => window.removeEventListener(ANALYTICS_CONSENT_EVENT, onStoreChange);
    },
    getAnalyticsConsent,
    () => null,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const panelRef = useRef<HTMLElement>(null);
  const rejectRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onChanged = () => setSettingsOpen(false);

    const onOpenSettings = () => setSettingsOpen(true);

    window.addEventListener(ANALYTICS_CONSENT_EVENT, onChanged);
    window.addEventListener("open-analytics-settings", onOpenSettings);

    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, onChanged);
      window.removeEventListener("open-analytics-settings", onOpenSettings);
    };
  }, []);

  const visible = consent === null || settingsOpen;

  useOverlayFocus({
    open: settingsOpen,
    containerRef: panelRef,
    initialFocusRef: rejectRef,
    onClose: () => setSettingsOpen(false),
  });

  const choose = (value: "accepted" | "rejected") => {
    setAnalyticsConsent(value);
    setSettingsOpen(false);
  };

  if (!visible) return null;

  const panel = (
    <section
      ref={panelRef}
      className={`analyticsConsent${settingsOpen ? " analyticsConsentSettings" : ""}`}
      role={settingsOpen ? "dialog" : "region"}
      aria-modal={settingsOpen ? "true" : undefined}
      aria-labelledby="analytics-consent-title"
      aria-label={settingsOpen ? undefined : "방문 분석 선택"}
      onMouseDown={(event) => event.stopPropagation()}
      tabIndex={settingsOpen ? -1 : undefined}
    >
      <div className="analyticsConsentInner">
        <div>
          <p className="analyticsConsentEyebrow">PRIVACY CHOICE</p>
          <h2 id="analytics-consent-title">방문 분석 사용 여부를 선택해 주세요</h2>
          <p>
            필수 상담 기능은 선택과 관계없이 사용할 수 있습니다. 동의하면
            Meta Pixel과 Google Analytics를 통해 광고·방문 성과를 분석합니다.
          </p>
        </div>
        <div className="analyticsConsentActions">
          <button
            ref={settingsOpen ? rejectRef : undefined}
            type="button"
            className="analyticsConsentReject"
            onClick={() => choose("rejected")}
          >
            선택 기능 거부
          </button>
          <button
            type="button"
            className="analyticsConsentAccept"
            onClick={() => choose("accepted")}
          >
            분석 사용 동의
          </button>
        </div>
      </div>
    </section>
  );

  return settingsOpen ? (
    <div className="analyticsConsentBackdrop" role="presentation" onMouseDown={() => setSettingsOpen(false)}>
      {panel}
    </div>
  ) : panel;
}
