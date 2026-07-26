"use client";

import { useState } from "react";
import { openLeadModal } from "@/lib/analytics";

const faqs = [
  {
    question: "분양가와 잔여세대는 어디에서 확인하나요?",
    answer: "동·호수와 타입에 따라 조건이 다를 수 있어 관심고객 등록 또는 대표번호 1833-8384를 통해 최신 안내를 받아주세요.",
  },
  {
    question: "어떤 타입으로 구성되어 있나요?",
    answer: "84㎡ A·B, 104㎡ A·B, 113㎡ A·B의 총 6개 타입으로 구성되어 있으며 총 1,009세대입니다.",
  },
  {
    question: "입주 예정 시기는 언제인가요?",
    answer: "홍보물 기준 2029년 10월 예정입니다. 사업 일정과 현장 여건에 따라 변경될 수 있으며 정확한 일자는 추후 안내됩니다.",
  },
  {
    question: "관심고객 등록 정보는 어떻게 사용되나요?",
    answer: "분양 상담과 관련 안내를 위해 사용되며, 실제 운영 전 개인정보 처리방침과 보유기간을 사업자 기준에 맞게 확정해야 합니다.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="section faqSection" id="faq">
      <div className="shell faqLayout">
        <div className="faqIntro">
          <p className="sectionEyebrow">FAQ</p>
          <h2 className="sectionTitle">자주 묻는 질문</h2>
          <p className="bodyCopy">더 자세한 조건은 공식 입주자모집공고와 견본주택 안내를 우선으로 확인해 주세요.</p>
          <button type="button" className="faqConsult" onClick={() => openLeadModal("faq")}>상담으로 확인하기</button>
        </div>

        <div className="faqList">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <article className={`faqItem ${isOpen ? "open" : ""}`} key={item.question}>
                <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : index)} aria-expanded={isOpen}>
                  <span>{item.question}</span>
                  <b aria-hidden="true">{isOpen ? "−" : "+"}</b>
                </button>
                {isOpen && <p>{item.answer}</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
