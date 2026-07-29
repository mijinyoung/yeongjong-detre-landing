"use client";

import { openLeadModal } from "@/lib/analytics";
import { projectConfig } from "@/data/project-config";

export default function WhyNow() {
  const section = projectConfig.sections.whyNow;

  return (
    <section className="section whyV50" id="why-now">
      <div className="shell">
        <div className="whyV50Heading">
          <div>
            <p className="sectionEyebrow">{section.eyebrow}</p>
            <h2 className="sectionTitle">
              {section.titleLines[0]}
              <br />
              {section.titleLines[1]}
            </h2>
          </div>
          <div className="whyV50Intro">
            <p>{section.intro}</p>
            <button type="button" onClick={() => openLeadModal("why-now")}>핵심 분양정보 상담</button>
          </div>
        </div>

        <div className="whyV50Grid">
          {section.items.map((item) => (
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
