"use client";

import { FormEvent, useState } from "react";
import { trackEvent, trackLeadComplete } from "@/lib/analytics";
import { createLeadEventId, formatPhoneInput, getLeadAttribution, getMetaLeadContext, goToThankYou } from "@/lib/client-lead";
import { PrivacyPolicyButton } from "@/components/PrivacyPolicy";

type State = "idle" | "sending" | "done" | "error";

export default function QuickLead() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [leadId, setLeadId] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") || "").trim();
    const consent = form.get("consent") === "on";

    if (!name || !/^01[016789]-\d{3,4}-\d{4}$/.test(phone) || !consent) {
      setState("error");
      setMessage("이름, 휴대폰 번호, 개인정보 동의를 확인해 주세요.");
      return;
    }

    setState("sending");
    setMessage("");
    const attribution = getLeadAttribution();
    const eventId = createLeadEventId();
    const metaContext = getMetaLeadContext(eventId);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          consent,
          website: String(form.get("website") || ""),
          ...attribution,
          referrer: document.referrer,
          pageUrl: window.location.href,
          placement: "quick-lead",
          ...metaContext,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "등록에 실패했습니다.");

      setState("done");
      setLeadId(String(data.leadId || ""));
      setMessage("등록이 완료되었습니다. 담당자가 순차적으로 연락드리겠습니다.");
      formElement.reset();
      setPhone("");
      trackLeadComplete(eventId, { placement: "quick-lead", source: attribution.source });
      goToThankYou(String(data.leadId || ""), "quick-lead");
    } catch (error) {
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
          <form className="quickLeadForm" onSubmit={submit} noValidate>
            <input name="name" placeholder="이름" aria-label="이름" autoComplete="name" />
            <input
              name="phone"
              value={phone}
              onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
              placeholder="010-0000-0000"
              aria-label="휴대폰 번호"
              inputMode="tel"
              autoComplete="tel"
            />
            <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <div className="consentRow quickAgree">
              <label><input type="checkbox" name="consent" /> 개인정보 수집 및 이용에 동의합니다.</label>
              <PrivacyPolicyButton />
            </div>
            <button className="primaryButton" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "등록 중..." : "관심고객 등록"}
            </button>
            {state === "error" && <p className="quickError" role="alert">{message}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
