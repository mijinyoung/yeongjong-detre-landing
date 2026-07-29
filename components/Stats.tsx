import { projectConfig } from "@/data/project-config";

export default function Stats() {
  const items = projectConfig.hero.facts;

  return (
    <section className="section light" id="overview">
      <div className="shell">
        <p className="sectionEyebrow">AT A GLANCE</p>
        <h2 className="sectionTitle">숫자로 확인하는 랜드마크</h2>
        <div className="statGrid">
          {items.map((item) => <article className="statCard" key={item.label}><strong>{item.value}</strong><span>{item.label}</span></article>)}
        </div>
      </div>
    </section>
  );
}
