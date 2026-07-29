"use client";

import { useState } from "react";
import { openLeadModal } from "@/lib/analytics";
import { projectConfig } from "@/data/project-config";

export default function InteractiveLocation() {
  const section = projectConfig.sections.location;
  const places = section.places;
  const [selected, setSelected] = useState(places[0]);

  return (
    <section className="section locationV3" id="location-v3">
      <div className="shell">
        <div className="locationV3Heading">
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

        <div className="locationV3Panel">
          <div className="locationV3Map" aria-label={section.mapAriaLabel}>
            <div className="mapWater" aria-hidden="true" />
            <div className="mapRoute" aria-hidden="true" />
            <div className="mapOrigin">
              <span>현재 위치</span>
              <strong>
                {projectConfig.identity.shortName}
              </strong>
            </div>

            {places.map((place, index) => (
              <button
                key={place.id}
                type="button"
                className={`mapPoint point${index + 1} ${selected.id === place.id ? "active" : ""}`}
                onClick={() => setSelected(place)}
                aria-pressed={selected.id === place.id}
              >
                <span>{place.shortTime}</span>
                <strong>{place.title}</strong>
              </button>
            ))}
          </div>

          <aside className="locationV3Detail" aria-live="polite">
            <span className="locationV3Badge">{selected.label}</span>

            <div className="locationTimeV42" aria-label={selected.shortTime}>
              {selected.shortTime}
            </div>

            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
            <button
              type="button"
              onClick={() => openLeadModal(`location-${selected.id}`)}
            >
              입지 상세 상담 <span aria-hidden="true">→</span>
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}
