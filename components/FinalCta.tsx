"use client";

import { openLeadModal } from "@/lib/analytics";

export default function FinalCta() {
  return (
    <section className="finalCta" id="final-contact">
      <div className="shell finalCtaInner">
        <div>
          <p>YEONGJONG DÉTRE LA MER</p>
          <h2>분양가·잔여세대·상담 일정<br />지금 바로 확인하세요.</h2>
        </div>
        <div className="finalCtaActions">
          <button type="button" onClick={() => openLeadModal("final-cta")}>관심고객 등록</button>
          <a href="tel:18338384">☎ 1833-8384</a>
        </div>
      </div>
    </section>
  );
}
