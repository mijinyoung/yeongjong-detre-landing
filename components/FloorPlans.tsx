"use client";

import Image from "next/image";
import { type KeyboardEvent, useRef, useState } from "react";
import { openLeadModal } from "@/lib/analytics";
import { useOverlayFocus } from "@/lib/use-overlay-focus";
import { projectConfig } from "@/data/project-config";

export default function FloorPlans() {
  const section = projectConfig.sections.floorPlans;
  const plans = section.items;
  const [selected, setSelected] = useState("84A");
  const [zoomOpen, setZoomOpen] = useState(false);
  const zoomRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const plan = plans.find((item) => item.id === selected) || plans[0];

  useOverlayFocus({
    open: zoomOpen,
    containerRef: zoomRef,
    initialFocusRef: closeRef,
    onClose: () => setZoomOpen(false),
  });

  const moveTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % plans.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + plans.length) % plans.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = plans.length - 1;
    else return;

    event.preventDefault();
    setSelected(plans[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <section className="section floorV60" id="floor-plans">
      <div className="shell">
        <div className="floorHeading">
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

        <div className="planTabs" role="tablist" aria-label="주거 타입 선택">
          {plans.map((item, index) => (
            <button
              key={item.id}
              ref={(element) => { tabRefs.current[index] = element; }}
              id={`floor-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={selected === item.id}
              aria-controls={`floor-panel-${item.id}`}
              tabIndex={selected === item.id ? 0 : -1}
              className={selected === item.id ? "active" : ""}
              onClick={() => setSelected(item.id)}
              onKeyDown={(event) => moveTab(event, index)}
            >
              {item.id}
            </button>
          ))}
        </div>

        <div
          className="floorV60Panel"
          id={`floor-panel-${plan.id}`}
          role="tabpanel"
          aria-labelledby={`floor-tab-${plan.id}`}
        >
          <button className="floorV61ImageButton" type="button" onClick={() => setZoomOpen(true)} aria-label={`${plan.id} 타입 평면도 크게 보기`}>
            <span className="floorPlanArtwork">
              <Image
                key={plan.image}
                src={plan.image}
                alt={`${plan.id} 타입 공식 평면도`}
                width={1867}
                height={882}
                sizes="(max-width: 900px) 100vw, 68vw"
                className="floorV61Image"
              />
            </span>
            <span className="imageZoomHint">클릭하여 평면도 크게 보기</span>
          </button>

          <div className="floorInfo">
            <span className="floorBadge">{plan.households}</span>
            <h3>{plan.id} TYPE</h3>
            <p className="floorFeature">{plan.feature}</p>
            <dl>
              <div><dt>전용면적</dt><dd>{plan.exclusive}</dd></div>
              <div><dt>공급면적</dt><dd>{plan.supply}</dd></div>
              <div><dt>계약면적</dt><dd>{plan.contract}</dd></div>
            </dl>
            <button className="floorCta" onClick={() => openLeadModal(`floor-${plan.id}`)}>
              {plan.id} 타입 상세 상담 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>

      {zoomOpen && (
        <div ref={zoomRef} className="brochureZoom" role="dialog" aria-modal="true" aria-label={`${plan.id} 타입 평면도 확대 이미지`} onClick={() => setZoomOpen(false)} tabIndex={-1}>
          <button ref={closeRef} type="button" className="brochureZoomClose" onClick={() => setZoomOpen(false)} aria-label="확대 이미지 닫기">×</button>
          <div className="brochureZoomCanvas floorZoomCanvas" onClick={(event) => event.stopPropagation()}>
            <div className="floorPlanArtwork floorZoomArtwork">
              <Image src={plan.image} alt={`${plan.id} 타입 공식 평면도`} width={1867} height={882} className="brochureZoomImage" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
