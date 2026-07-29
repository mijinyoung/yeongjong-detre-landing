import Image from "next/image";
import { projectConfig } from "@/data/project-config";

export default function Landmark() {
  const section = projectConfig.sections.landmark;

  return (
    <section className="section warm">
      <div className="shell split">
        <div>
          <p className="sectionEyebrow">{section.eyebrow}</p>
          <h2 className="sectionTitle">{section.titleLines[0]}<br />{section.titleLines[1]}</h2>
          <p className="bodyCopy">{section.description}</p>
          <ul className="checkList">{section.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
        </div>
        <div className="imageFrame"><Image src={section.image} alt={section.imageAlt} width={905} height={965} sizes="(max-width: 900px) 100vw, 50vw" className="landmarkImage" /></div>
      </div>
    </section>
  );
}
