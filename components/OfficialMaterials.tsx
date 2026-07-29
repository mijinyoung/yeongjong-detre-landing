"use client";

import Image from "next/image";
import { type KeyboardEvent, useRef, useState } from "react";
import { openLeadModal } from "@/lib/analytics";
import { useOverlayFocus } from "@/lib/use-overlay-focus";
import { projectConfig } from "@/data/project-config";

export default function OfficialMaterials() {
  const section = projectConfig.sections.officialMaterials;
  const materials = section.items;
  const [selected, setSelected] = useState(materials[0]);
  const [zoomOpen, setZoomOpen] = useState(false);
  const zoomRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useOverlayFocus({
    open: zoomOpen,
    containerRef: zoomRef,
    initialFocusRef: closeRef,
    onClose: () => setZoomOpen(false),
  });

  const moveTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % materials.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + materials.length) % materials.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = materials.length - 1;
    else return;

    event.preventDefault();
    setSelected(materials[nextIndex]);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section className="section officialV60" id="official-materials">
      <div className="shell">
        <div className="officialV60Heading">
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

        <div className="officialV60Tabs" role="tablist" aria-label="공식 자료 선택">
          {materials.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => { tabRefs.current[index] = element; }}
              id={`official-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected.id === item.id}
              aria-controls={`official-panel-${item.id}`}
              tabIndex={selected.id === item.id ? 0 : -1}
              className={selected.id === item.id ? "active" : ""}
              onClick={() => setSelected(item)}
              onKeyDown={(event) => moveTab(event, index)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          className="officialV60Panel"
          id={`official-panel-${selected.id}`}
          role="tabpanel"
          aria-labelledby={`official-tab-${selected.id}`}
        >
          <button
            className="officialV61ImageButton"
            type="button"
            onClick={() => setZoomOpen(true)}
            aria-label={`${selected.label} 크게 보기`}
          >
            <Image
              key={selected.image}
              src={selected.image}
              alt={selected.alt}
              width={1467}
              height={693}
              sizes="(max-width: 900px) 100vw, 68vw"
              className="officialV61Image"
            />
            <span className="imageZoomHint">클릭하여 크게 보기</span>
          </button>

          <aside className="officialV60Copy">
            <span>{selected.label}</span>
            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
            <button type="button" onClick={() => openLeadModal(`official-${selected.id}`)}>
              공식 자료 상세 상담 <span aria-hidden="true">→</span>
            </button>
          </aside>
        </div>
      </div>

      {zoomOpen && (
        <div ref={zoomRef} className="brochureZoom" role="dialog" aria-modal="true" aria-label={`${selected.label} 확대 이미지`} onClick={() => setZoomOpen(false)} tabIndex={-1}>
          <button ref={closeRef} type="button" className="brochureZoomClose" onClick={() => setZoomOpen(false)} aria-label="확대 이미지 닫기">×</button>
          <div className="brochureZoomCanvas" onClick={(event) => event.stopPropagation()}>
            <Image src={selected.image} alt={selected.alt} width={1467} height={693} className="brochureZoomImage" />
          </div>
        </div>
      )}
    </section>
  );
}
