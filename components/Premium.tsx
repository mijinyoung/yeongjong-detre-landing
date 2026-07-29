import { projectConfig } from "@/data/project-config";

export default function Premium() {
  const section = projectConfig.sections.premium;

  return (
    <section className="section navy" id="premium">
      <div className="shell">
        <p className="sectionEyebrow gold">{section.eyebrow}</p>
        <h2 className="sectionTitle white">{section.title}</h2>
        <div className="premiumGrid">
          {section.items.map((item) => <article className="premiumCard" key={item.no}><span>{item.no}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}
        </div>
      </div>
    </section>
  );
}
