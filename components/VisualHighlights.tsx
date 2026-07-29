import Image from "next/image";
import { projectConfig } from "@/data/project-config";

export default function VisualHighlights() {
  const section = projectConfig.sections.visualHighlights;

  return (
    <section className="section visualHighlights" id="visual-highlights">
      <div className="shell">
        <div className="visualHighlightsHeading">
          <div>
            <p className="sectionEyebrow">{section.eyebrow}</p>
            <h2 className="sectionTitle">
              {section.titleLines[0]}
              <br />
              {section.titleLines[1]}
            </h2>
          </div>
          <p className="bodyCopy">{section.intro}</p>
        </div>

        <div className="visualHighlightsGrid">
          {section.items.map((item, index) => (
            <a
              className={`visualHighlightCard visualHighlightCard--${item.id}${index === 0 ? " featured" : ""}`}
              href={item.href}
              key={item.id}
            >
              <Image
                src={item.image}
                alt={item.alt}
                fill
                sizes={
                  index === 0
                    ? "(max-width: 760px) 100vw, 66vw"
                    : "(max-width: 760px) 100vw, 34vw"
                }
                className="visualHighlightImage"
              />
              <span className="visualHighlightShade" aria-hidden="true" />
              <span className="visualHighlightCopy">
                <small>{item.label}</small>
                <strong>{item.title}</strong>
                <span>{item.description}</span>
                <i aria-hidden="true">자세히 보기 →</i>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
