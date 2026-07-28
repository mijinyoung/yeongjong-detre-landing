"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

export default function ThankYouClient() {
  const searchParams = useSearchParams();
  const receipt = searchParams.get("receipt") || "";
  const placement = searchParams.get("placement") || "unknown";

  useEffect(() => {
    trackEvent("lead_thank_you_view", { placement, hasReceipt: Boolean(receipt) });
  }, [placement, receipt]);

  return (
    <main className="thankYouPage">
      <section className="thankYouCard" aria-labelledby="thank-you-title">
        <div className="thankYouMark" aria-hidden="true">✓</div>
        <p className="thankYouEyebrow">REGISTRATION COMPLETE</p>
        <h1 id="thank-you-title">관심고객 등록이<br />완료되었습니다.</h1>
        <p className="thankYouCopy">
          담당자가 접수 내용을 확인한 뒤 순차적으로 연락드리겠습니다.
          빠른 상담이 필요하시면 아래 전화상담을 이용해 주세요.
        </p>

        {receipt && (
          <div className="thankYouReceipt">
            <span>접수번호</span>
            <strong>{receipt}</strong>
          </div>
        )}

        <div className="thankYouActions">
          <a href="tel:18338384" data-placement="thank-you" onClick={() => trackEvent("phone_click", { placement: "thank-you" })}>전화상담 1833-8384</a>
          <a href="/" className="secondary">홈페이지로 돌아가기</a>
        </div>

        <div className="thankYouNext">
          <strong>상담 진행 순서</strong>
          <ol><li>접수 내용 확인</li><li>담당자 전화 안내</li><li>방문 및 상세 상담</li></ol>
        </div>
        <small>접수번호를 보관하시면 상담 확인에 도움이 됩니다.</small>
      </section>
    </main>
  );
}
