"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { openLeadModal } from "@/lib/analytics";

type Plan = {
  id: string;
  exclusive: string;
  supply: string;
  contract: string;
  households: string;
  feature: string;
  image: string;
};

const plans: Plan[] = [
  { id: "84A", exclusive: "84.9873㎡", supply: "112.7904㎡", contract: "182.9234㎡", households: "168세대", feature: "풍부한 수납과 가변형 공간을 갖춘 실용 중심 타입", image: "/images/brochure/floor-84a.webp" },
  { id: "84B", exclusive: "84.9388㎡", supply: "114.0779㎡", contract: "184.1708㎡", households: "170세대", feature: "거실과 주방의 개방감을 강화한 생활 중심 타입", image: "/images/brochure/floor-84b.webp" },
  { id: "104A", exclusive: "104.9940㎡", supply: "139.2509㎡", contract: "225.8937㎡", households: "247세대", feature: "대형 팬트리와 다목적 공간을 더한 패밀리 타입", image: "/images/brochure/floor-104a.webp" },
  { id: "104B", exclusive: "104.9695㎡", supply: "139.1270㎡", contract: "225.7496㎡", households: "248세대", feature: "침실과 공용공간의 균형을 높인 프리미엄 타입", image: "/images/brochure/floor-104b.webp" },
  { id: "113A", exclusive: "113.9691㎡", supply: "150.2654㎡", contract: "244.3146㎡", households: "88세대", feature: "여유로운 면적과 다양한 수납을 갖춘 대형 타입", image: "/images/brochure/floor-113a.webp" },
  { id: "113B", exclusive: "113.9456㎡", supply: "150.4896㎡", contract: "244.5195㎡", households: "88세대", feature: "독립적인 침실 구성과 넉넉한 공용공간의 대형 타입", image: "/images/brochure/floor-113b.webp" },
];

export default function FloorPlans() {
  const [selected, setSelected] = useState("84A");
  const [zoomOpen, setZoomOpen] = useState(false);
  const plan = useMemo(() => plans.find((item) => item.id === selected) || plans[0], [selected]);

  useEffect(() => {
    if (!zoomOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", close);
    };
  }, [zoomOpen]);

  return (
    <section className="section floorV60" id="floor-plans">
      <div className="shell">
        <div className="floorHeading">
          <div>
            <p className="sectionEyebrow">OFFICIAL UNIT PLAN</p>
            <h2 className="sectionTitle">
              상담북의 실제 평면으로 보는
              <br />
              6가지 주거 타입
            </h2>
          </div>
          <p className="bodyCopy">
            84㎡, 104㎡, 113㎡ A·B 타입의 공식 홍보 평면을 반영했습니다.
            면적과 구성은 인쇄물 기준이며 계약 전 입주자모집공고와 견본주택을 반드시 확인해 주세요.
          </p>
        </div>

        <div className="planTabs" role="tablist" aria-label="주거 타입 선택">
          {plans.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected === item.id}
              className={selected === item.id ? "active" : ""}
              onClick={() => setSelected(item.id)}
            >
              {item.id}
            </button>
          ))}
        </div>

        <div className="floorV60Panel">
          <button className="floorV61ImageButton" type="button" onClick={() => setZoomOpen(true)} aria-label={`${plan.id} 타입 평면도 크게 보기`}>
            <Image
              key={plan.image}
              src={plan.image}
              alt={`${plan.id} 타입 공식 평면도`}
              width={1867}
              height={928}
              sizes="(max-width: 900px) 100vw, 68vw"
              className="floorV61Image"
            />
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
        <div className="brochureZoom" role="dialog" aria-modal="true" aria-label={`${plan.id} 타입 평면도 확대 이미지`} onClick={() => setZoomOpen(false)}>
          <button type="button" className="brochureZoomClose" onClick={() => setZoomOpen(false)} aria-label="확대 이미지 닫기">×</button>
          <div className="brochureZoomCanvas floorZoomCanvas" onClick={(event) => event.stopPropagation()}>
            <Image src={plan.image} alt={`${plan.id} 타입 공식 평면도`} width={1867} height={928} className="brochureZoomImage" priority />
          </div>
        </div>
      )}
    </section>
  );
}
