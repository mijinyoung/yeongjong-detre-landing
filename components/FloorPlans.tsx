"use client";

import { useMemo, useState } from "react";
import { openLeadModal } from "@/lib/analytics";

type Plan = {
  id: string;
  exclusive: string;
  supply: string;
  contract: string;
  households: string;
  rooms: string;
  feature: string;
};

const plans: Plan[] = [
  { id: "84A", exclusive: "84.9873㎡", supply: "112.7904㎡", contract: "182.9234㎡", households: "168세대", rooms: "침실 3 + 알파룸 2", feature: "풍부한 수납과 가변형 공간을 갖춘 실용 중심 타입" },
  { id: "84B", exclusive: "84.9388㎡", supply: "114.0779㎡", contract: "184.1708㎡", households: "170세대", rooms: "침실 3 + 넓은 거실", feature: "거실과 주방의 개방감을 강화한 생활 중심 타입" },
  { id: "104A", exclusive: "104.9940㎡", supply: "139.2509㎡", contract: "225.8937㎡", households: "247세대", rooms: "침실 4 + 알파룸 2", feature: "대형 팬트리와 다목적 공간을 더한 패밀리 타입" },
  { id: "104B", exclusive: "104.9695㎡", supply: "139.1270㎡", contract: "225.7496㎡", households: "248세대", rooms: "침실 4 + 드레스룸", feature: "침실과 공용공간의 균형을 높인 프리미엄 타입" },
  { id: "113A", exclusive: "113.9691㎡", supply: "150.2654㎡", contract: "244.3146㎡", households: "88세대", rooms: "침실 4 + 알파룸 2", feature: "여유로운 면적과 다양한 수납을 갖춘 대형 타입" },
  { id: "113B", exclusive: "113.9456㎡", supply: "150.4896㎡", contract: "244.5195㎡", households: "88세대", rooms: "침실 4 + 파우더룸", feature: "독립적인 침실 구성과 넉넉한 공용공간의 대형 타입" },
];

const planBlocks = {
  "84A": ["현관", "팬트리", "침실2", "욕실", "침실3", "거실", "주방", "침실1", "드레스룸", "알파룸"],
  "84B": ["현관", "팬트리", "침실2", "욕실", "침실3", "거실", "주방", "침실1", "파우더룸", "드레스룸"],
  "104A": ["현관", "팬트리", "침실2", "침실4", "침실3", "거실", "주방", "침실1", "드레스룸", "알파룸"],
  "104B": ["현관", "팬트리", "침실2", "침실4", "침실3", "거실", "주방", "침실1", "파우더룸", "드레스룸"],
  "113A": ["현관", "팬트리", "침실2", "침실4", "침실3", "거실", "주방", "침실1", "드레스룸", "알파룸2"],
  "113B": ["현관", "팬트리", "침실2", "침실4", "침실3", "거실", "주방", "침실1", "파우더룸", "드레스룸"],
} as const;

export default function FloorPlans() {
  const [selected, setSelected] = useState("84A");
  const plan = useMemo(() => plans.find((item) => item.id === selected) || plans[0], [selected]);
  const blocks = planBlocks[selected as keyof typeof planBlocks];

  return (
    <section className="section floorSection" id="floor-plans">
      <div className="shell">
        <div className="floorHeading">
          <div>
            <p className="sectionEyebrow">UNIT PLAN</p>
            <h2 className="sectionTitle">라이프스타일에 맞춘<br />6가지 주거 타입</h2>
          </div>
          <p className="bodyCopy">84㎡, 104㎡, 113㎡ A·B 타입으로 구성됩니다. 평면 구성과 면적은 홍보물 기준이며 계약 전 견본주택과 입주자모집공고를 반드시 확인해 주세요.</p>
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

        <div className="floorPanel">
          <div className="floorVisual" aria-label={`${plan.id} 타입 개념 평면도`}>
            <div className="floorVisualHeader"><strong>{plan.id}</strong><span>CONCEPT PLAN</span></div>
            <div className="floorGrid">
              {blocks.map((block, index) => (
                <div key={`${block}-${index}`} className={`floorRoom room${index + 1}`}>{block}</div>
              ))}
            </div>
            <small>※ 위 도식은 공간 구성을 이해하기 위한 개념 이미지이며 실제 평면도와 다릅니다.</small>
          </div>

          <div className="floorInfo">
            <span className="floorBadge">{plan.households}</span>
            <h3>{plan.id} TYPE</h3>
            <p className="floorFeature">{plan.feature}</p>
            <dl>
              <div><dt>전용면적</dt><dd>{plan.exclusive}</dd></div>
              <div><dt>공급면적</dt><dd>{plan.supply}</dd></div>
              <div><dt>계약면적</dt><dd>{plan.contract}</dd></div>
              <div><dt>공간구성</dt><dd>{plan.rooms}</dd></div>
            </dl>
            <button className="floorCta" onClick={() => openLeadModal(`floor-${plan.id}`)}>
              {plan.id} 타입 상세 상담 <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
