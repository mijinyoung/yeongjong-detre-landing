"use client";

import { openLeadModal } from "@/lib/analytics";

export default function FloatingActions() {
  return (
    <nav className="floatingActions" aria-label="빠른 상담">
      <a href="tel:18338384">전화상담</a>
      <button onClick={() => openLeadModal("floating")}>관심고객 등록</button>
    </nav>
  );
}
