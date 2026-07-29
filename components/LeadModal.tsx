"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { trackEvent, trackLeadComplete } from "@/lib/analytics";
import { createLeadEventId, getLeadAttribution, getMetaLeadContext, goToThankYou, submitLead } from "@/lib/client-lead";
import { PrivacyPolicyButton } from "@/components/PrivacyPolicy";
import { LeadFieldErrors, validateLeadFields } from "@/lib/lead-form-validation";
import { useOverlayFocus } from "@/lib/use-overlay-focus";
import { contactHref, projectConfig } from "@/data/project-config";

type Status = "idle" | "sending" | "done" | "error";

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function LeadModal() {
  const submittingRef = useRef(false);
  const eventIdRef = useRef("");
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState("modal");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [leadId, setLeadId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LeadFieldErrors>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      if (submittingRef.current) return;
      const custom = event as CustomEvent<{ placement?: string }>;
      submittingRef.current = false;
      eventIdRef.current = "";
      setPlacement(custom.detail?.placement || "modal");
      setStatus("idle");
      setMessage("");
      setPhone("");
      setLeadId("");
      setFieldErrors({});
      setOpen(true);
      trackEvent("lead_modal_open", { placement: custom.detail?.placement || "modal" });
    };
    window.addEventListener("open-lead-modal", handler);
    return () => window.removeEventListener("open-lead-modal", handler);
  }, []);

  const closeModal = () => {
    if (status === "sending") return;
    setOpen(false);
  };

  useOverlayFocus({
    open,
    containerRef: dialogRef,
    initialFocusRef: nameRef,
    onClose: closeModal,
  });

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || status === "sending") return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const consent = form.get("consent") === "on";
    const errors = validateLeadFields(name, phone, consent);

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setStatus("error");
      setMessage("입력 내용을 확인해 주세요.");
      window.requestAnimationFrame(() => {
        if (errors.name) nameRef.current?.focus();
        else if (errors.phone) phoneRef.current?.focus();
        else consentRef.current?.focus();
      });
      return;
    }

    submittingRef.current = true;
    setFieldErrors({});
    setStatus("sending");
    setMessage("");
    const attribution = getLeadAttribution();
    const eventId = eventIdRef.current || createLeadEventId();
    eventIdRef.current = eventId;
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
      eventIdRef.current = "";
      goToThankYou(String(data.leadId || ""), placement);
    } catch (error) {
      submittingRef.current = false;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "등록에 실패했습니다.");
    }
  }

  if (!open) return null;

  return (
    <div className="leadModalBackdrop" role="presentation" onMouseDown={closeModal}>
      <div ref={dialogRef} className="leadModal" role="dialog" aria-modal="true" aria-labelledby="lead-modal-title" aria-describedby="lead-modal-description" onMouseDown={(e) => e.stopPropagation()} tabIndex={-1}>
        <button className="leadModalClose" type="button" aria-label="상담 신청창 닫기" onClick={closeModal} disabled={status === "sending"}>×</button>
        {status === "done" ? (
          <div className="leadModalSuccess" role="status">
            <span>✓</span>
            <h2>관심고객 등록 완료</h2>
            <p>{message}</p>
            {leadId && <small className="leadReceipt">접수번호 {leadId}</small>}
            <a href={contactHref}>지금 전화하기 {projectConfig.contact.displayPhone}</a>
          </div>
        ) : (
          <>
            <p className="leadModalEyebrow">30초 간편 등록</p>
            <h2 id="lead-modal-title">분양가·잔여세대<br />우선 안내</h2>
            <p className="leadModalIntro" id="lead-modal-description">연락처를 남겨주시면 담당자가 빠르게 안내드립니다.</p>
            <div className="leadModalTrust" aria-label="상담 신청 안내">
              <span>✓ 무료 상담</span><span>✓ 상담 외 사용 없음</span><span>✓ 언제든 취소 가능</span>
            </div>
            <form
              className="leadModalForm"
              data-lead-form={placement}
              onSubmit={submit}
              noValidate
            >
              <label>
                이름
                <input
                  required
                  minLength={2}
                  maxLength={30}
                  ref={nameRef}
                  name="name"
                  placeholder="성함을 입력하세요"
                  autoComplete="name"
                  aria-invalid={Boolean(fieldErrors.name)}
                  aria-describedby={fieldErrors.name ? "lead-modal-name-error" : undefined}
                  onChange={() => setFieldErrors((current) => ({ ...current, name: undefined }))}
                />
                {fieldErrors.name ? <span className="fieldError" id="lead-modal-name-error">{fieldErrors.name}</span> : null}
              </label>
              <label>
                휴대폰 번호
                <input
                  required
                  ref={phoneRef}
                  name="phone"
                  value={phone}
                  onChange={(e) => {
                    setPhone(formatPhone(e.target.value));
                    setFieldErrors((current) => ({ ...current, phone: undefined }));
                  }}
                  placeholder="010-0000-0000"
                  inputMode="tel"
                  autoComplete="tel"
                  aria-invalid={Boolean(fieldErrors.phone)}
                  aria-describedby={fieldErrors.phone ? "lead-modal-phone-error" : undefined}
                />
                {fieldErrors.phone ? <span className="fieldError" id="lead-modal-phone-error">{fieldErrors.phone}</span> : null}
              </label>
              <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <div className="consentRow agree">
                <label>
                  <input
                    required
                    ref={consentRef}
                    type="checkbox"
                    name="consent"
                    aria-invalid={Boolean(fieldErrors.consent)}
                    aria-describedby={fieldErrors.consent ? "lead-modal-consent-error" : undefined}
                    onChange={() => setFieldErrors((current) => ({ ...current, consent: undefined }))}
                  />
                  개인정보 수집 및 상담 연락에 동의합니다.
                </label>
                <PrivacyPolicyButton />
                {fieldErrors.consent ? <span className="fieldError consentError" id="lead-modal-consent-error">{fieldErrors.consent}</span> : null}
              </div>
              {status === "error" && <p className="formError" role="alert">{message}</p>}
              <button className="primaryButton wide" type="submit" aria-busy={status === "sending"} disabled={status === "sending"}>{status === "sending" ? "등록 중..." : "관심고객 등록하기"}</button>
              <small>입력 정보는 분양 상담 안내 목적으로만 사용됩니다.</small>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
