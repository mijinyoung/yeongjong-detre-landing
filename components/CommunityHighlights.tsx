import { projectConfig } from "@/data/project-config";

export default function CommunityHighlights() {
  const section = projectConfig.sections.community;

  return (
    <section className="section communityV33" id="community">
      <div className="shell">
        <div className="communityV33Heading">
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

        <div className="communityV33Grid">
          {section.items.map((item, index) => (
            <article className="communityV33Card" key={item.title}>
              <span className="communityV33Index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p>{item.label}</p>
              <h3>{item.title}</h3>
              <div className="communityV33Line" aria-hidden="true" />
              <span>{item.description}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
