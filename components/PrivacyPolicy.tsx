"use client";

import { useEffect, useRef, useState } from "react";
import { openPrivacyPolicy } from "@/lib/client-lead";

export function PrivacyPolicyButton({ className = "" }: { className?: string }) {
  return (
    <button type="button" className={`privacyOpenButton ${className}`.trim()} onClick={openPrivacyPolicy}>
      자세히 보기
    </button>
  );
}

export default function PrivacyPolicy() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-privacy-policy", handler);
    return () => window.removeEventListener("open-privacy-policy", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => closeRef.current?.focus(), 50);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="privacyBackdrop" role="presentation" onMouseDown={() => setOpen(false)}>
      <section
        className="privacyDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="privacy-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button ref={closeRef} className="privacyClose" type="button" aria-label="개인정보 안내 닫기" onClick={() => setOpen(false)}>
          ×
        </button>
        <p className="privacyEyebrow">PRIVACY NOTICE</p>
        <h2 id="privacy-title">개인정보 수집 및 이용 안내</h2>
        <div className="privacyContent">
          <dl>
            <div><dt>수집 항목</dt><dd>이름, 휴대폰 번호, 상담 유입 정보</dd></div>
            <div><dt>이용 목적</dt><dd>분양 상담, 방문 일정 및 관련 정보 안내</dd></div>
            <div><dt>보유 및 이용 기간</dt><dd>상담 목적 달성 또는 동의 철회 시까지. 관계 법령에 따른 보관 의무가 있는 경우 해당 기간 동안 보관할 수 있습니다.</dd></div>
            <div><dt>동의 거부 권리</dt><dd>동의를 거부할 수 있으나, 거부 시 상담 신청이 제한됩니다.</dd></div>
          </dl>
          <p className="privacyDraftNote">
            운영 전 실제 개인정보 처리 주체, 위탁사, 보유기간 및 연락처를 입주자모집공고와 운영 정책에 맞게 최종 확인해 주세요.
          </p>
        </div>
        <button className="primaryButton wide" type="button" onClick={() => setOpen(false)}>확인했습니다</button>
      </section>
    </div>
  );
}
