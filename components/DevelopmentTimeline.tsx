"use client";

import { openLeadModal } from "@/lib/analytics";
import { projectConfig } from "@/data/project-config";

export default function DevelopmentTimeline() {
  const section = projectConfig.sections.timeline;

  return (
    <section className="section timelineSection" id="future-value">
      <div className="shell">
        <div className="timelineHeading">
          <div>
            <p className="sectionEyebrow gold">{section.eyebrow}</p>
            <h2 className="sectionTitle white">{section.titleLines[0]}<br />{section.titleLines[1]}</h2>
          </div>
          <p className="timelineIntro">{section.intro}</p>
        </div>

        <div className="timelineRail">
          {section.items.map((item) => (
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
