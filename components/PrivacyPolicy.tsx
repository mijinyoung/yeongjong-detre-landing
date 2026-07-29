"use client";

import { useEffect, useRef, useState } from "react";
import { openPrivacyPolicy } from "@/lib/client-lead";
import { useOverlayFocus } from "@/lib/use-overlay-focus";
import { projectConfig } from "@/data/project-config";

export function PrivacyPolicyButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={`privacyOpenButton ${className}`.trim()} onClick={openPrivacyPolicy}>
      자세히 보기
    </button>
  );
}

export default function PrivacyPolicy() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-privacy-policy", handler);
    return () => window.removeEventListener("open-privacy-policy", handler);
  }, []);

  useOverlayFocus({
    open,
    containerRef: dialogRef,
    initialFocusRef: closeRef,
    onClose: () => setOpen(false),
  });

  if (!open) return null;

  return (
    <div className="privacyBackdrop" role="presentation" onMouseDown={() => setOpen(false)}>
      <section
        ref={dialogRef}
        className="privacyDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        aria-describedby="privacy-summary"
        onMouseDown={(event) => event.stopPropagation()}
        tabIndex={-1}
      >
        <button ref={closeRef} className="privacyClose" type="button" aria-label="개인정보 안내 닫기" onClick={() => setOpen(false)}>
          ×
        </button>
        <p className="privacyEyebrow">PRIVACY NOTICE</p>
        <h2 id="privacy-title">개인정보 수집 및 이용 안내</h2>
        <p className="srOnly" id="privacy-summary">상담 신청 과정에서 처리하는 개인정보 항목과 이용 목적, 보유 기간 안내</p>
        <div className="privacyContent">
          <dl>
            <div><dt>수집 항목</dt><dd>이름, 휴대폰 번호, 신청 위치·유입경로·광고 캠페인, 접속 페이지·이전 페이지, 광고 클릭 식별자, 동의 시각, IP 주소와 브라우저 정보</dd></div>
            <div><dt>이용 목적</dt><dd>{projectConfig.legal.privacyPurpose}</dd></div>
            <div><dt>보유 및 이용 기간</dt><dd>{projectConfig.legal.privacyRetention}</dd></div>
            <div><dt>동의 거부 권리</dt><dd>동의를 거부할 수 있으나, 거부 시 상담 신청이 제한됩니다.</dd></div>
            <div><dt>처리 서비스</dt><dd>접수 정보는 Google Sheets에 저장될 수 있으며 담당자 알림을 위해 SOLAPI 또는 별도 문자 연동이 사용될 수 있습니다.</dd></div>
            <div><dt>방문·광고 분석</dt><dd>별도 동의한 경우에만 Meta Pixel, Google Analytics와 Meta 전환 API가 실행되며, 전환 측정을 위해 해시 처리된 이름·전화번호와 접속 정보가 사용될 수 있습니다. 푸터의 방문 분석 설정에서 언제든 선택을 변경할 수 있습니다.</dd></div>
          </dl>
          <p className="privacyDraftNote">
            개인정보 동의 철회와 상담 정보 관련 문의는 {projectConfig.contact.privacyContactLabel} {projectConfig.contact.displayPhone}로 연락해 주세요.
          </p>
        </div>
        <button className="primaryButton wide" type="button" onClick={() => setOpen(false)}>확인했습니다</button>
      </section>
    </div>
  );
}
