import { projectConfig } from "@/data/project-config";

export default function Location() {
  const section = projectConfig.sections.location;

  return (
    <section className="section locationSection" id="location">
      <div className="shell">
        <p className="sectionEyebrow">{section.eyebrow}</p>
        <div className="locationHeading">
          <h2 className="sectionTitle">{section.titleLines[0]}<br />{section.titleLines[1]}</h2>
          <p className="bodyCopy">{section.intro}</p>
        </div>
        <div className="routeGrid">
          {section.places.map((place) => (
            <article className="routeCard" key={place.id}>
              <strong>{place.shortTime}</strong>
              <h3>{place.title}</h3>
              <p>{place.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
