import { projectConfig } from "@/data/project-config";

export default function BusinessOverview() {
  const section = projectConfig.sections.businessOverview;

  return (
    <section className="section overviewV40" id="business-overview">
      <div className="shell">
        <div className="overviewV40Heading">
          <div>
            <p className="sectionEyebrow">{section.eyebrow}</p>
            <h2 className="sectionTitle">{section.titleLines[0]}<br />{section.titleLines[1]}</h2>
          </div>
          <p className="bodyCopy">{section.intro}</p>
        </div>

        <div className="overviewV40Grid">
          {section.items.map((item, index) => (
            <article key={item.label} className="overviewV40Item">
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <p>{item.label}</p>
                <strong>{item.value}</strong>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
