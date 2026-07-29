"use client";

import { openLeadModal, trackEvent } from "@/lib/analytics";
import { contactHref, projectConfig } from "@/data/project-config";

export default function VisitProcess() {
  const section = projectConfig.sections.visitProcess;

  return (
    <section className="section visitProcess" id="visit-process">
      <div className="shell">
        <div className="visitProcessHeading">
          <div>
            <p className="sectionEyebrow">{section.eyebrow}</p>
            <h2 className="sectionTitle">
              {section.titleLines[0]}
              <br />
              {section.titleLines[1]}
            </h2>
          </div>
          <div className="visitProcessIntro">
            <p className="bodyCopy">{section.intro}</p>
            <button type="button" onClick={() => openLeadModal("visit-process") }>
              30초 상담 신청 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <ol className="visitProcessSteps">
          {section.items.map((step) => (
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
            <strong>{projectConfig.contact.displayPhone}</strong>
          </div>
          <a
            href={contactHref}
            onClick={() => trackEvent("phone_click", { source: "visit-process" })}
          >
            지금 전화하기
          </a>
        </div>
      </div>
    </section>
  );
}
