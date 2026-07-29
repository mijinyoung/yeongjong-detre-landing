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
            <figure className="communityV120Visual">
              <Image
                src={section.image}
                alt={section.imageAlt}
                fill
                sizes="(max-width: 760px) 36vw, 240px"
                className="communityV120Image"
              />
              <figcaption className="srOnly">
                영종 디에트르 라 메르 커뮤니티 시스템 공식 안내
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="communityV120Layout">
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
