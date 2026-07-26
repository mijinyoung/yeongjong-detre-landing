"use client";

import Image from "next/image";
import { openLeadModal } from "@/lib/analytics";

const benefits = [
  { value: "5분", label: "청라하늘대교 통과" },
  { value: "15분", label: "인천국제공항" },
  { value: "30분", label: "여의도" },
];

const facts = [
  { value: "최고 49층", label: "랜드마크 스카이라인" },
  { value: "총 1,009세대", label: "대단지 프리미엄" },
  { value: "세대당 약 1.9대", label: "여유로운 주차 계획" },
  { value: "84·104·113㎡", label: "다양한 주거 타입" },
];

export default function Hero() {
  const goToForm = () => openLeadModal("hero");

  return (
    <section className="heroV2" id="top">
      <Image
        src="/images/hero-v2.png"
        alt="영종 디에트르 라 메르 투시도"
        fill
        priority
        sizes="100vw"
        className="heroV2Image"
      />
      <div className="heroV2Overlay" />

      <header className="heroV2Header shell">
        <a className="brand brandV2" href="#top" aria-label="영종 디에트르 라 메르 홈">
          <strong>DÉTRE</strong>
          <span>LA MER</span>
        </a>

        <nav className="desktopNav heroV2Nav" aria-label="주요 메뉴">
          <a href="#business-overview">사업개요</a>
          <a href="#location-v3">입지환경</a>
          <a href="#premium">프리미엄</a>
          <a href="#community">커뮤니티</a>
          <a href="#lead-form">관심고객등록</a>
        </nav>

        <a className="heroV2Call" href="tel:18338384" aria-label="1833-8384로 전화하기">
          <span>☎</span> 1833-8384
        </a>
      </header>

      <div className="heroV2Content shell">
        <div className="heroV2CopyBlock">
          <p className="heroV2Eyebrow">YEONGJONG INTERNATIONAL CITY</p>
          <h1>
            영종 디에트르
            <br />
            <em>라 메르</em>
          </h1>
          <p className="heroV2Copy">
            청라하늘대교 개통으로 더 가까워지는 영종
            <br />
            최고 49층 스카이라인과 오션뷰 프리미엄
          </p>

          <div className="heroV2Benefits" aria-label="주요 입지 정보">
            {benefits.map((item) => (
              <div key={item.label}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>

          <div className="heroV2Buttons">
            <button className="heroV2Primary" onClick={goToForm}>
              관심고객 등록 <span aria-hidden="true">→</span>
            </button>
            <a className="heroV2Ghost" href="tel:18338384">
              전화 상담
            </a>
          </div>
        </div>
      </div>

      <div className="heroV2Facts shell" aria-label="단지 핵심 정보">
        {facts.map((item) => (
          <div key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
