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
          <p className="bodyCopy">{section.intro}</p>
        </div>

        <div className="communityV120Layout">
          <figure className="communityV120Visual">
            <Image
              src={section.image}
              alt={section.imageAlt}
              fill
              sizes="(max-width: 900px) 100vw, 50vw"
              className="communityV120Image"
            />
            <figcaption>OFFICIAL SYSTEM &amp; COMMUNITY GUIDE</figcaption>
          </figure>

          <div className="communityV120Grid">
            {section.items.map((item, index) => (
              <article className="communityV120Card" key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item.label}</p>
                <h3>{item.title}</h3>
                <small>{item.description}</small>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
