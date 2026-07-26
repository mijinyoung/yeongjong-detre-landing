"use client";

import { FormEvent, useState } from "react";
import { trackEvent } from "@/lib/analytics";

type State = "idle" | "sending" | "done" | "error";

export default function QuickLead() {
  const [state, setState] = useState<State>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const consent = form.get("consent") === "on";

    if (!name || !/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone) || !consent) {
      setState("error");
      setMessage("이름, 휴대폰 번호, 개인정보 동의를 확인해 주세요.");
      return;
    }

    setState("sending");
    setMessage("");

    const params = new URLSearchParams(window.location.search);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          consent,
          website: String(form.get("website") || ""),
          source: params.get("utm_source") || "direct",
          campaign: params.get("utm_campaign") || "",
          content: params.get("utm_content") || "",
          referrer: document.referrer,
          pageUrl: window.location.href,
          placement: "quick-lead",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "등록에 실패했습니다.");

      setState("done");
      setMessage("등록이 완료되었습니다. 담당자가 순차적으로 연락드리겠습니다.");
      event.currentTarget.reset();
      trackEvent("lead_complete", {
        placement: "quick-lead",
        source: params.get("utm_source") || sessionStorage.getItem("utm_source") || "direct",
      });
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
          <div className="quickSuccess" role="status">✓ {message}</div>
        ) : (
          <form className="quickLeadForm" onSubmit={submit} noValidate>
            <input name="name" placeholder="이름" aria-label="이름" autoComplete="name" />
            <input name="phone" placeholder="010-0000-0000" aria-label="휴대폰 번호" inputMode="tel" autoComplete="tel" />
            <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <label className="quickAgree"><input type="checkbox" name="consent" /> 개인정보 수집 동의</label>
            <button className="primaryButton" type="submit" disabled={state === "sending"}>
              {state === "sending" ? "등록 중..." : "관심고객 등록"}
            </button>
            {state === "error" && <p className="quickError">{message}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
