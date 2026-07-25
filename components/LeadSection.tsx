"use client";

import { FormEvent, useEffect, useState } from "react";

type Status = "idle" | "sending" | "done" | "error";

export default function LeadSection() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [agree, setAgree] = useState(false);
  const [utm, setUtm] = useState({ source: "", campaign: "", content: "" });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setUtm({
      source: params.get("utm_source") || "direct",
      campaign: params.get("utm_campaign") || "",
      content: params.get("utm_content") || "",
    });
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const website = String(form.get("website") || "");

    if (!name.trim() || !/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone) || !agree) {
      setStatus("error");
      setMessage("이름, 올바른 휴대폰 번호, 개인정보 동의를 확인해 주세요.");
      return;
    }

    setStatus("sending");
    setMessage("");

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          consent: agree,
          website,
          source: utm.source,
          campaign: utm.campaign,
          content: utm.content,
          referrer: document.referrer,
          pageUrl: window.location.href,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.message || "등록에 실패했습니다.");
      setStatus("done");
      setMessage(data.message);
      window.dispatchEvent(new CustomEvent("lead-complete", { detail: { source: utm.source } }));
    } catch (error) {
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
          <a className="phoneBig" href="tel:18338384">1833-8384</a>
        </div>
        {status === "done" ? (
          <div className="successBox"><span>✓</span><h3>등록이 완료되었습니다.</h3><p>{message}</p><button className="textButton" onClick={() => setStatus("idle")}>다른 고객 등록하기</button></div>
        ) : (
          <form className="leadForm" onSubmit={submit} noValidate>
            <label>이름<input value={name} onChange={(e) => setName(e.target.value)} placeholder="성함을 입력하세요" autoComplete="name" /></label>
            <label>휴대폰 번호<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" inputMode="tel" autoComplete="tel" /></label>
            <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <label className="agree"><input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} /> 개인정보 수집 및 상담 연락에 동의합니다.</label>
            {status === "error" && <p className="formError" role="alert">{message}</p>}
            <button className="primaryButton wide" type="submit" disabled={status === "sending"}>{status === "sending" ? "등록 중..." : "관심고객 등록하기"}</button>
            <small>입력하신 정보는 분양 상담 안내 목적으로만 사용됩니다.</small>
          </form>
        )}
      </div>
    </section>
  );
}
