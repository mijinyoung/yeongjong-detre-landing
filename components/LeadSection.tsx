"use client";

import { FormEvent, useRef, useState } from "react";
import { trackLeadComplete } from "@/lib/analytics";
import { createLeadEventId, formatPhoneInput, getLeadAttribution, getMetaLeadContext, goToThankYou, submitLead } from "@/lib/client-lead";
import { PrivacyPolicyButton } from "@/components/PrivacyPolicy";
import { LeadFieldErrors, validateLeadFields } from "@/lib/lead-form-validation";
import { contactHref, projectConfig } from "@/data/project-config";

type Status = "idle" | "sending" | "done" | "error";

export default function LeadSection() {
  const submittingRef = useRef(false);
  const eventIdRef = useRef("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [leadId, setLeadId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LeadFieldErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || status === "sending") return;

    const form = new FormData(event.currentTarget);
    const website = String(form.get("website") || "");
    const errors = validateLeadFields(name, phone, agree);

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
        consent: agree,
        website,
        ...attribution,
        referrer: document.referrer,
        pageUrl: window.location.href,
        placement: "lead-section",
        ...metaContext,
      });

      setStatus("done");
      setLeadId(String(data.leadId || ""));
      setMessage(data.message);
      trackLeadComplete(eventId, { placement: "lead-section", source: attribution.source });
      submittingRef.current = false;
      eventIdRef.current = "";
      goToThankYou(String(data.leadId || ""), "lead-section");
    } catch (error) {
      submittingRef.current = false;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "등록에 실패했습니다.");
    }
  }

  return (
    <section className="section leadSection" id="lead-form">
      <div className="shell leadWrap">
        <div>
          <p className="sectionEyebrow gold">PRIORITY INFORMATION</p>
          <h2 className="sectionTitle white">관심고객으로 등록하고<br />분양 정보를 우선 안내받으세요.</h2>
          <p className="bodyCopy muted">분양가, 잔여세대, 방문상담 일정 등을 담당자가 순차적으로 안내드립니다.</p>
          <a className="phoneBig" href={contactHref} data-placement="lead-section">{projectConfig.contact.displayPhone}</a>
        </div>
        {status === "done" ? (
          <div className="successBox">
            <span>✓</span><h3>등록이 완료되었습니다.</h3><p>{message}</p>{leadId && <small className="leadReceipt">접수번호 {leadId}</small>}
            <button className="textButton" type="button" onClick={() => { eventIdRef.current = ""; setStatus("idle"); setName(""); setPhone(""); setAgree(false); setLeadId(""); setFieldErrors({}); }}>다른 고객 등록하기</button>
          </div>
        ) : (
          <form
            className="leadForm"
            data-lead-form="bottom-form"
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
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setFieldErrors((current) => ({ ...current, name: undefined }));
                }}
                placeholder="성함을 입력하세요"
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "lead-section-name-error" : undefined}
              />
              {fieldErrors.name ? <span className="fieldError" id="lead-section-name-error">{fieldErrors.name}</span> : null}
            </label>
            <label>
              휴대폰 번호
              <input
                required
                ref={phoneRef}
                value={phone}
                onChange={(event) => {
                  setPhone(formatPhoneInput(event.target.value));
                  setFieldErrors((current) => ({ ...current, phone: undefined }));
                }}
                placeholder="010-0000-0000"
                inputMode="tel"
                autoComplete="tel"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? "lead-section-phone-error" : undefined}
              />
              {fieldErrors.phone ? <span className="fieldError" id="lead-section-phone-error">{fieldErrors.phone}</span> : null}
            </label>
            <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <div className="consentRow agree">
              <label>
                <input
                  required
                  ref={consentRef}
                  type="checkbox"
                  checked={agree}
                  onChange={(event) => {
                    setAgree(event.target.checked);
                    setFieldErrors((current) => ({ ...current, consent: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.consent)}
                  aria-describedby={fieldErrors.consent ? "lead-section-consent-error" : undefined}
                />
                개인정보 수집 및 상담 연락에 동의합니다.
              </label>
              <PrivacyPolicyButton />
              {fieldErrors.consent ? <span className="fieldError consentError" id="lead-section-consent-error">{fieldErrors.consent}</span> : null}
            </div>
            {status === "error" && <p className="formError" role="alert">{message}</p>}
            <button className="primaryButton wide" type="submit" aria-busy={status === "sending"} disabled={status === "sending"}>{status === "sending" ? "등록 중..." : "관심고객 등록하기"}</button>
            <small>입력하신 정보는 분양 상담 안내 목적으로만 사용됩니다.</small>
          </form>
        )}
      </div>
    </section>
  );
}
