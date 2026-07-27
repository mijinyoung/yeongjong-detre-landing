"use client";

import { openLeadModal, trackEvent } from "@/lib/analytics";

const steps = [
  {
    number: "01",
    title: "관심고객 등록",
    description: "이름과 연락처를 남기면 상담 접수가 완료됩니다.",
  },
  {
    number: "02",
    title: "담당자 안내",
    description: "타입·분양 조건·방문 가능 일정에 대한 안내를 받습니다.",
  },
  {
    number: "03",
    title: "방문 상담",
    description: "공식 자료와 현장 안내를 바탕으로 상세 내용을 확인합니다.",
  },
];

export default function VisitProcess() {
  return (
    <section className="section visitProcess" id="visit-process">
      <div className="shell">
        <div className="visitProcessHeading">
          <div>
            <p className="sectionEyebrow">CONSULTATION PROCESS</p>
            <h2 className="sectionTitle">
              관심 등록부터
              <br />
              방문 상담까지
            </h2>
          </div>
          <div className="visitProcessIntro">
            <p className="bodyCopy">
              분양 조건과 잔여세대는 상담 시점에 따라 달라질 수 있습니다.
              관심고객으로 등록하고 최신 안내를 확인해 주세요.
            </p>
            <button type="button" onClick={() => openLeadModal("visit-process") }>
              30초 상담 신청 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <ol className="visitProcessSteps">
          {steps.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="visitProcessContact">
          <div>
            <small>대표 상담번호</small>
            <strong>1833-8384</strong>
          </div>
          <a
            href="tel:18338384"
            onClick={() => trackEvent("phone_click", { source: "visit-process" })}
          >
            지금 전화하기
          </a>
        </div>
      </div>
    </section>
  );
}
