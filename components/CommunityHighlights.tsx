import Image from "next/image";
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
          <div className="communityV120Intro">
            <p className="bodyCopy">{section.intro}</p>
          </div>
        </div>

        <div className="communityV120Layout">
          <div className="communityV120Grid">
            {section.items.map((item, index) => (
              <article className="communityV120Card" key={item.title}>
                <div className="communityV120CardCopy">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <p>{item.label}</p>
                  <h3>{item.title}</h3>
                  <small>{item.description}</small>
                </div>
                <figure className="communityV120Media">
                  <Image
                    src={item.image}
                    alt={item.imageAlt}
                    fill
                    sizes="(max-width: 760px) 38vw, (max-width: 980px) 36vw, 20vw"
                    className="communityV120FacilityImage"
                  />
                </figure>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
