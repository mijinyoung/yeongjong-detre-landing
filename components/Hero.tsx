"use client";

import Image from "next/image";
import { openLeadModal, trackEvent } from "@/lib/analytics";
import MobileNavigation from "@/components/MobileNavigation";

const proofPoints = [
  "청라하늘대교 생활권",
  "최고 49층 스카이라인",
  "총 1,009세대",
  "84·104·113㎡",
];

const facts = [
  { value: "약 5분", label: "청라하늘대교 통과" },
  { value: "약 15분", label: "인천국제공항" },
  { value: "2029.10", label: "입주 예정" },
  { value: "1833-8384", label: "분양 문의" },
];

export default function Hero() {
  const openForm = (source: string) => openLeadModal(source);

  return (
    <section className="heroV50" id="top">
      <Image
        src="/images/hero-v2.png"
        alt="영종 디에트르 라 메르 투시도"
        fill
        priority
        sizes="100vw"
        className="heroV50Image"
      />
      <div className="heroV50Shade" aria-hidden="true" />

      <header className="heroV50Header shell">
        <a className="heroV50Brand" href="#top" aria-label="영종 디에트르 라 메르 홈">
          <strong>DÉTRE</strong>
          <span>LA MER</span>
        </a>

        <nav className="heroV50Nav" aria-label="주요 메뉴">
          <a href="#why-now">핵심가치</a>
          <a href="#business-overview">사업개요</a>
          <a href="#location-v3">입지환경</a>
          <a href="#community">커뮤니티</a>
          <a href="#floor-plans">평면안내</a>
        </nav>

        <MobileNavigation />

        <a
          className="heroV50Phone"
          href="tel:18338384"
          onClick={() => trackEvent("phone_click", { source: "hero-header" })}
        >
          <small>분양문의</small>
          <strong>1833-8384</strong>
        </a>
      </header>

      <div className="heroV50Content shell">
        <div className="heroV50Copy">
          <p className="heroV50Eyebrow">YEONGJONG INTERNATIONAL CITY</p>
          <h1>
            청라하늘대교로
            <br />
            더욱 가까워진 영종
          </h1>
          <p className="heroV50Project">영종 디에트르 라 메르</p>
          <p className="heroV50Description">
            최고 49층의 새로운 스카이라인과 바다를 품은 주거 가치.
            <br className="desktopOnly" />
            관심고객 등록으로 분양 안내를 먼저 받아보세요.
          </p>

          <ul className="heroV50Proof" aria-label="단지 핵심 특징">
            {proofPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <div className="heroV50Actions">
            <button type="button" onClick={() => openForm("hero-primary")}> 
              관심고객 등록 <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="heroV50Secondary"
              onClick={() => openForm("hero-brochure")}
            >
              분양자료 상담
            </button>
          </div>
        </div>

        <div className="heroV50Vertical" aria-hidden="true">
          <span>THE VALUABLE LIFESTYLE</span>
        </div>
      </div>

      <div className="heroV50Facts shell" aria-label="핵심 정보">
        {facts.map((fact) => (
          <div key={fact.label}>
            <strong>{fact.value}</strong>
            <span>{fact.label}</span>
          </div>
        ))}
      </div>

      <a className="heroV50Scroll" href="#quick-lead" aria-label="다음 내용으로 이동">
        <span>SCROLL</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
