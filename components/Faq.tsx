"use client";

import { useState } from "react";
import { openLeadModal } from "@/lib/analytics";

import { faqItems } from "@/data/site-content";



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
          {faqItems.map((item, index) => {
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
