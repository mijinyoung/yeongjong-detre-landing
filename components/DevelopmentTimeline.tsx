"use client";

import { openLeadModal } from "@/lib/analytics";

const milestones = [
  {
    step: "01",
    title: "청라하늘대교 연결",
    text: "영종과 청라를 연결하는 교통축을 통해 생활권의 확장이 기대됩니다.",
  },
  {
    step: "02",
    title: "영종·청라 생활권 확대",
    text: "쇼핑·문화·의료 등 다양한 생활 인프라를 폭넓게 누릴 수 있는 여건이 마련됩니다.",
  },
  {
    step: "03",
    title: "최고 49층 랜드마크",
    text: "최고 49층, 총 1,009세대 규모로 영종의 새로운 스카이라인을 제안합니다.",
  },
  {
    step: "04",
    title: "2029년 10월 입주 예정",
    text: "입주시기는 사업 일정에 따라 변경될 수 있으며 정확한 일정은 추후 안내됩니다.",
  },
];

export default function DevelopmentTimeline() {
  return (
    <section className="section timelineSection" id="future-value">
      <div className="shell">
        <div className="timelineHeading">
          <div>
            <p className="sectionEyebrow gold">FUTURE VISION</p>
            <h2 className="sectionTitle white">연결에서 생활로,<br />생활에서 랜드마크로</h2>
          </div>
          <p className="timelineIntro">
            개발계획과 교통여건은 관계기관의 계획에 따라 변경될 수 있으며, 미래가치나 시세 상승을 보장하지 않습니다.
          </p>
        </div>

        <div className="timelineRail">
          {milestones.map((item) => (
            <article className="timelineItem" key={item.step}>
              <span className="timelineStep">{item.step}</span>
              <div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="timelineCta">
          <div>
            <strong>분양가와 잔여세대가 궁금하신가요?</strong>
            <span>관심고객 등록 후 담당자가 순차적으로 안내드립니다.</span>
          </div>
          <button type="button" onClick={() => openLeadModal("timeline")}>30초 상담 신청</button>
        </div>
      </div>
    </section>
  );
}
