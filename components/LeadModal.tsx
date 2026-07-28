"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { trackEvent, trackLeadComplete } from "@/lib/analytics";
import { createLeadEventId, getLeadAttribution, getMetaLeadContext, goToThankYou, submitLead } from "@/lib/client-lead";
import { PrivacyPolicyButton } from "@/components/PrivacyPolicy";

type Status = "idle" | "sending" | "done" | "error";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function LeadModal() {
  const submittingRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState("modal");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [leadId, setLeadId] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<{ placement?: string }>;
      submittingRef.current = false;
      setPlacement(custom.detail?.placement || "modal");
      setStatus("idle");
      setMessage("");
      setLeadId("");
      setOpen(true);
      trackEvent("lead_modal_open", { placement: custom.detail?.placement || "modal" });
    };
    window.addEventListener("open-lead-modal", handler);
    return () => window.removeEventListener("open-lead-modal", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => nameRef.current?.focus(), 80);
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || status === "sending") return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const consent = form.get("consent") === "on";

    if (!name || !/^01[016789]-\d{3,4}-\d{4}$/.test(phone) || !consent) {
      setStatus("error");
      setMessage("이름, 휴대폰 번호, 개인정보 동의를 확인해 주세요.");
      return;
    }

    submittingRef.current = true;
    setStatus("sending");
    setMessage("");
    const attribution = getLeadAttribution();
    const eventId = createLeadEventId();
    const metaContext = getMetaLeadContext(eventId);

    try {
      const data = await submitLead({
          name,
          phone,
          consent,
          website: String(form.get("website") || ""),
          ...attribution,
          referrer: document.referrer,
          pageUrl: window.location.href,
          placement,
          ...metaContext,
        });
      setStatus("done");
      setLeadId(String(data.leadId || ""));
      setMessage(data.message);
      trackLeadComplete(eventId, { placement, source: attribution.source });
      submittingRef.current = false;
      goToThankYou(String(data.leadId || ""), placement);
    } catch (error) {
      submittingRef.current = false;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "등록에 실패했습니다.");
    }
  }

  if (!open) return null;

  return (
    <div className="leadModalBackdrop" role="presentation" onMouseDown={() => setOpen(false)}>
      <div className="leadModal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title" onMouseDown={(e) => e.stopPropagation()}>
        <button className="leadModalClose" type="button" aria-label="닫기" onClick={() => setOpen(false)}>×</button>
        {status === "done" ? (
          <div className="leadModalSuccess" role="status">
            <span>✓</span>
            <h2>관심고객 등록 완료</h2>
            <p>{message}</p>
            {leadId && <small className="leadReceipt">접수번호 {leadId}</small>}
            <a href="tel:18338384">지금 전화하기 1833-8384</a>
          </div>
        ) : (
          <>
            <p className="leadModalEyebrow">30초 간편 등록</p>
            <h2 id="lead-modal-title">분양가·잔여세대<br />우선 안내</h2>
            <p className="leadModalIntro">연락처를 남겨주시면 담당자가 빠르게 안내드립니다.</p>
            <div className="leadModalTrust" aria-label="상담 신청 안내">
              <span>✓ 무료 상담</span><span>✓ 상담 외 사용 없음</span><span>✓ 언제든 취소 가능</span>
            </div>
            <form className="leadModalForm" onSubmit={submit} noValidate>
              <label>이름<input ref={nameRef} name="name" placeholder="성함을 입력하세요" autoComplete="name" /></label>
              <label>휴대폰 번호<input name="phone" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="010-0000-0000" inputMode="tel" autoComplete="tel" /></label>
              <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <div className="consentRow agree"><label><input type="checkbox" name="consent" /> 개인정보 수집 및 상담 연락에 동의합니다.</label><PrivacyPolicyButton /></div>
              {status === "error" && <p className="formError" role="alert">{message}</p>}
              <button className="primaryButton wide" type="submit" disabled={status === "sending"}>{status === "sending" ? "등록 중..." : "관심고객 등록하기"}</button>
              <small>입력 정보는 분양 상담 안내 목적으로만 사용됩니다.</small>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
