"use client";

import { useEffect, useState } from "react";
import {
  ANALYTICS_CONSENT_EVENT,
  getAnalyticsConsent,
  setAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics";

export default function AnalyticsConsentManager() {
  const [consent, setConsent] = useState<AnalyticsConsent>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setConsent(getAnalyticsConsent());

    const onChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ value?: AnalyticsConsent }>;
      setConsent(customEvent.detail?.value ?? getAnalyticsConsent());
      setSettingsOpen(false);
    };

    const onOpenSettings = () => setSettingsOpen(true);

    window.addEventListener(ANALYTICS_CONSENT_EVENT, onChanged);
    window.addEventListener("open-analytics-settings", onOpenSettings);

    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, onChanged);
      window.removeEventListener("open-analytics-settings", onOpenSettings);
    };
  }, []);

  const visible = consent === null || settingsOpen;
  if (!visible) return null;

  const choose = (value: "accepted" | "rejected") => {
    setAnalyticsConsent(value);
    setConsent(value);
    setSettingsOpen(false);
  };

  return (
    <section
      className="analyticsConsent"
      role="dialog"
      aria-modal={settingsOpen ? "true" : undefined}
      aria-labelledby="analytics-consent-title"
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
}
