"use client";

import { useEffect, useState } from "react";
import { openLeadModal, trackEvent } from "@/lib/analytics";

export default function FloatingActions() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const update = () => setVisible(window.scrollY > 260);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <nav className={`floatingActions${visible ? " isVisible" : ""}`} aria-label="빠른 상담">
      <a
        href="tel:18338384"
        data-placement="floating"
        aria-label="1833-8384로 전화상담"
        onClick={() => trackEvent("phone_click", { placement: "floating" })}
      >
        <span className="floatingIcon" aria-hidden="true">☎</span>
        <span><small>바로 연결</small>전화상담</span>
      </a>
      <button type="button" onClick={() => openLeadModal("floating")}> 
        <span className="floatingIcon" aria-hidden="true">✦</span>
        <span><small>30초 간편접수</small>관심고객 등록</span>
      </button>
    </nav>
  );
}
