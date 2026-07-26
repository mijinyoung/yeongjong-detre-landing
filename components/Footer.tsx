"use client";

import { openPrivacyPolicy } from "@/lib/client-lead";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footerInner">
        <div>
          <strong>영종 디에트르 라 메르</strong>
          <p>상담문의 1833-8384</p>
        </div>
        <button className="footerPrivacy" type="button" onClick={openPrivacyPolicy}>개인정보 수집 및 이용 안내</button>
        <small>본 페이지의 이미지와 내용은 소비자의 이해를 돕기 위한 것으로 실제와 차이가 있을 수 있으며, 세부 내용은 입주자모집공고 및 견본주택에서 확인하시기 바랍니다.</small>
      </div>
    </footer>
  );
}
