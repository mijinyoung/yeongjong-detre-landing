"use client";

import { openPrivacyPolicy } from "@/lib/client-lead";
import { openAnalyticsSettings } from "@/lib/analytics";
import { projectConfig } from "@/data/project-config";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footerInner">
        <div>
          <strong>{projectConfig.identity.name}</strong>
          <p>상담문의 {projectConfig.contact.displayPhone}</p>
        </div>
        <div className="footerPolicyLinks">
          <button
            className="footerPrivacy"
            type="button"
            onClick={openPrivacyPolicy}
          >
            개인정보 수집 및 이용 안내
          </button>
          <button
            className="footerPrivacy"
            type="button"
            onClick={openAnalyticsSettings}
          >
            방문 분석 설정
          </button>
        </div>
        <small>{projectConfig.legal.footerNotice}</small>
      </div>
    </footer>
  );
}
