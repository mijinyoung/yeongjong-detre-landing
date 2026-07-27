"use client";

import Image from "next/image";
import { useState } from "react";
import { openLeadModal } from "@/lib/analytics";

const materials = [
  {
    id: "site",
    label: "단지배치도",
    title: "공원과 생활 편의를 연결한 단지 계획",
    image: "/images/brochure/site-plan.webp",
    alt: "영종 디에트르 라 메르 단지배치도",
    description:
      "중앙광장, 어린이놀이터, 키즈스테이션, D라운지, 티하우스 등 상담북에 안내된 주요 공간을 한눈에 확인할 수 있습니다.",
  },
  {
    id: "design",
    label: "랜드마크 디자인",
    title: "최고 49층 스카이라인과 야간 특화 경관",
    image: "/images/brochure/landmark-design.webp",
    alt: "영종 디에트르 라 메르 랜드마크 디자인 안내",
    description:
      "커튼월룩 외관과 조명을 활용해 영종의 새로운 도시 풍경을 제안하는 디자인 방향을 담았습니다.",
  },
  {
    id: "system",
    label: "시스템 프리미엄",
    title: "생활의 편리와 안전을 더하는 주거 시스템",
    image: "/images/brochure/system-premium.webp",
    alt: "영종 디에트르 라 메르 시스템 프리미엄",
    description:
      "차량 위치 인식, 주차 유도, 스마트 음성 인식, 원격 제어 등 상담북에 소개된 생활 편의 시스템입니다.",
  },
];

export default function OfficialMaterials() {
  const [selected, setSelected] = useState(materials[0]);

  return (
    <section className="section officialV60" id="official-materials">
      <div className="shell">
        <div className="officialV60Heading">
          <div>
            <p className="sectionEyebrow">OFFICIAL BROCHURE</p>
            <h2 className="sectionTitle">상담북으로 확인하는<br />디에트르의 실제 계획</h2>
          </div>
          <p className="bodyCopy">
            임의의 예시 이미지가 아닌, 제공된 상담북과 홍보물의 내용을 웹에서 보기 편하도록 재구성했습니다.
            세부 계획은 사업 진행 과정에서 변경될 수 있으며 계약 전 공식 공고를 우선 확인해 주세요.
          </p>
        </div>

        <div className="officialV60Tabs" role="tablist" aria-label="공식 자료 선택">
          {materials.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected.id === item.id}
              className={selected.id === item.id ? "active" : ""}
              onClick={() => setSelected(item)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="officialV60Panel">
          <div className="officialV60Image">
            <Image
              key={selected.image}
              src={selected.image}
              alt={selected.alt}
              fill
              sizes="(max-width: 900px) 100vw, 68vw"
            />
          </div>
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
    </section>
  );
}
