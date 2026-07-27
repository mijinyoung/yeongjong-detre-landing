"use client";

import { openLeadModal } from "@/lib/analytics";

const values = [
  {
    number: "01",
    keyword: "CONNECTION",
    title: "청라하늘대교 생활권",
    description: "영종과 청라를 잇는 연결축을 통해 생활 반경의 확장을 기대할 수 있습니다.",
  },
  {
    number: "02",
    keyword: "LANDMARK",
    title: "최고 49층 스카이라인",
    description: "커튼월룩 외관과 야간 특화조명이 계획된 영종의 새로운 랜드마크입니다.",
  },
  {
    number: "03",
    keyword: "SCALE",
    title: "총 1,009세대 대단지",
    description: "6개 주거 타입과 대단지 규모를 바탕으로 다양한 주거 선택지를 제공합니다.",
  },
  {
    number: "04",
    keyword: "LIFESTYLE",
    title: "프리미엄 커뮤니티",
    description: "수영장, 사우나, 피트니스, 골프 등 일상의 품격을 높이는 시설이 계획되어 있습니다.",
  },
  {
    number: "05",
    keyword: "ACCESS",
    title: "공항 직주근접 생활",
    description: "인천국제공항 및 관련 산업 종사자에게 편리한 생활권을 제공합니다.",
  },
];

export default function WhyNow() {
  return (
    <section className="section whyV50" id="why-now">
      <div className="shell">
        <div className="whyV50Heading">
          <div>
            <p className="sectionEyebrow">WHY YEONGJONG, WHY NOW</p>
            <h2 className="sectionTitle">
              지금 영종을
              <br />
              주목해야 하는 이유
            </h2>
          </div>
          <div className="whyV50Intro">
            <p>
              과장된 표현보다 확인 가능한 사업 정보와 생활 가치에 집중했습니다.
              핵심 내용을 먼저 살펴보고 상세 안내가 필요할 때 상담을 신청해 주세요.
            </p>
            <button type="button" onClick={() => openLeadModal("why-now")}>핵심 분양정보 상담</button>
          </div>
        </div>

        <div className="whyV50Grid">
          {values.map((item) => (
            <article key={item.number} className="whyV50Card">
              <span className="whyV50Number">{item.number}</span>
              <p>{item.keyword}</p>
              <h3>{item.title}</h3>
              <span className="whyV50Rule" aria-hidden="true" />
              <small>{item.description}</small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
