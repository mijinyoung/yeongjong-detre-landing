"use client";

import { openLeadModal } from "@/lib/analytics";
import { projectConfig } from "@/data/project-config";

export default function ConsultationGuide() {
  const section = projectConfig.sections.salesGuide;

  return (
    <section className="section consultationV41" id="consultation-guide">
      <div className="shell">
        <div className="consultationV41Heading">
          <div>
            <p className="sectionEyebrow">{section.eyebrow}</p>
            <h2 className="sectionTitle">{section.titleLines[0]}<br />{section.titleLines[1]}</h2>
          </div>
          <div className="consultationV41Intro">
            <p className="bodyCopy">{section.intro}</p>
            <button type="button" onClick={() => openLeadModal("sales-guide")}>
              내 조건으로 상담받기 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div className="consultationV41Grid">
          {section.items.map((item) => (
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
          {section.notice}
        </p>
      </div>
    </section>
  );
}
