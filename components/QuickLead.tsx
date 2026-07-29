"use client";

import { FormEvent, useRef, useState } from "react";
import { trackLeadComplete } from "@/lib/analytics";
import { createLeadEventId, formatPhoneInput, getLeadAttribution, getMetaLeadContext, goToThankYou, submitLead } from "@/lib/client-lead";
import { PrivacyPolicyButton } from "@/components/PrivacyPolicy";
import { LeadFieldErrors, validateLeadFields } from "@/lib/lead-form-validation";

type State = "idle" | "sending" | "done" | "error";

export default function QuickLead() {
  const submittingRef = useRef(false);
  const eventIdRef = useRef("");
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [leadId, setLeadId] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LeadFieldErrors>({});
  const nameRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submittingRef.current || state === "sending") return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "").trim();
    const consent = form.get("consent") === "on";
    const errors = validateLeadFields(name, phone, consent);

    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setState("error");
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
    setState("sending");
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
          placement: "quick-lead",
          ...metaContext,
        });

      setState("done");
      setLeadId(String(data.leadId || ""));
      setMessage(data.message);
      formElement.reset();
      setPhone("");
      trackLeadComplete(eventId, { placement: "quick-lead", source: attribution.source });
      submittingRef.current = false;
      eventIdRef.current = "";
      goToThankYou(String(data.leadId || ""), "quick-lead");
    } catch (error) {
      submittingRef.current = false;
      setState("error");
      setMessage(error instanceof Error ? error.message : "등록에 실패했습니다.");
    }
  }

  return (
    <section className="quickLead" id="quick-lead">
      <div className="shell quickLeadWrap">
        <div className="quickLeadCopy">
          <span>30초 간편 등록</span>
          <h2>분양가·잔여세대 우선 안내</h2>
          <p>관심고객 등록 후 담당자가 빠르게 안내드립니다.</p>
        </div>

        {state === "done" ? (
          <div className="quickSuccess" role="status"><strong>✓ {message}</strong>{leadId && <small className="leadReceipt">접수번호 {leadId}</small>}</div>
        ) : (
          <form
            className="quickLeadForm"
            data-lead-form="quick-lead"
            onSubmit={submit}
            noValidate
          >
            <div className="quickField">
              <input
                required
                minLength={2}
                maxLength={30}
                ref={nameRef}
                name="name"
                placeholder="이름"
                aria-label="이름"
                autoComplete="name"
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? "quick-name-error" : undefined}
                onChange={() => setFieldErrors((current) => ({ ...current, name: undefined }))}
              />
              {fieldErrors.name ? <span className="fieldError" id="quick-name-error">{fieldErrors.name}</span> : null}
            </div>
            <div className="quickField">
            <input
              ref={phoneRef}
              name="phone"
              value={phone}
              onChange={(event) => {
                setPhone(formatPhoneInput(event.target.value));
                setFieldErrors((current) => ({ ...current, phone: undefined }));
              }}
              placeholder="010-0000-0000"
              aria-label="휴대폰 번호"
              inputMode="tel"
              autoComplete="tel"
              required
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? "quick-phone-error" : undefined}
            />
              {fieldErrors.phone ? <span className="fieldError" id="quick-phone-error">{fieldErrors.phone}</span> : null}
            </div>
            <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <div className="consentRow quickAgree">
              <label>
                <input
                  required
                  ref={consentRef}
                  type="checkbox"
                  name="consent"
                  aria-invalid={Boolean(fieldErrors.consent)}
                  aria-describedby={fieldErrors.consent ? "quick-consent-error" : undefined}
                  onChange={() => setFieldErrors((current) => ({ ...current, consent: undefined }))}
                />
                개인정보 수집 및 이용에 동의합니다.
              </label>
              <PrivacyPolicyButton />
              {fieldErrors.consent ? <span className="fieldError consentError" id="quick-consent-error">{fieldErrors.consent}</span> : null}
            </div>
            <button className="primaryButton" type="submit" aria-busy={state === "sending"} disabled={state === "sending"}>
              {state === "sending" ? "등록 중..." : "관심고객 등록"}
            </button>
            {state === "error" && <p className="quickError" role="alert">{message}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
