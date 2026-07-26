"use client";

import { openLeadModal } from "@/lib/analytics";

const guideItems = [
  {
    number: "01",
    label: "계약 계획",
    title: "계약금 10%",
    description: "계약 시 5%, 계약 후 1개월 이내 5% 납부 계획으로 안내되어 있습니다.",
  },
  {
    number: "02",
    label: "중도금 계획",
    title: "중도금 60%",
    description: "중도금 대출은 이자후불제 조건으로 안내되며 개인별 심사 결과는 달라질 수 있습니다.",
  },
  {
    number: "03",
    label: "주거 선택",
    title: "6개 타입",
    description: "84㎡·104㎡·113㎡에서 A·B 타입을 비교해 생활 방식에 맞게 선택할 수 있습니다.",
  },
  {
    number: "04",
    label: "입주 계획",
    title: "2029년 10월 예정",
    description: "정확한 입주일과 계약 조건은 입주자모집공고 및 공식 안내를 우선 확인해야 합니다.",
  },
];

export default function ConsultationGuide() {
  return (
    <section className="section consultationV41" id="consultation-guide">
      <div className="shell">
        <div className="consultationV41Heading">
          <div>
            <p className="sectionEyebrow">SALES GUIDE</p>
            <h2 className="sectionTitle">상담 전에 확인하는<br />핵심 분양 안내</h2>
          </div>
          <div className="consultationV41Intro">
            <p className="bodyCopy">
              상담 시 가장 많이 확인하는 내용을 먼저 정리했습니다. 금액·대출·일정은 개인 조건과 사업 진행 상황에 따라 달라질 수 있습니다.
            </p>
            <button type="button" onClick={() => openLeadModal("sales-guide")}>
              내 조건으로 상담받기 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div className="consultationV41Grid">
          {guideItems.map((item) => (
            <article key={item.number} className="consultationV41Card">
              <span className="consultationV41Number">{item.number}</span>
              <p>{item.label}</p>
              <h3>{item.title}</h3>
              <span className="consultationV41Divider" aria-hidden="true" />
              <small>{item.description}</small>
            </article>
          ))}
        </div>

        <p className="consultationV41Notice">
          ※ 본 페이지는 상담 편의를 위한 요약 안내입니다. 정확한 계약 조건은 입주자모집공고와 견본주택 안내를 확인하시기 바랍니다.
        </p>
      </div>
    </section>
  );
}
