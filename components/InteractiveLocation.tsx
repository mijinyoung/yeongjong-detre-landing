"use client";

import { useState } from "react";
import { openLeadModal } from "@/lib/analytics";

const places = [
  {
    id: "bridge",
    time: "약 5분",
    title: "제3연륙교 통과",
    label: "청라 연결",
    description: "영종과 청라를 잇는 새로운 연결축으로 생활 반경의 확장을 기대할 수 있습니다.",
  },
  {
    id: "cheongna",
    time: "약 7분",
    title: "청라 생활권",
    label: "생활 인프라",
    description: "교통 여건 변화에 따라 청라의 쇼핑·의료·문화 인프라 접근성이 개선될 것으로 기대됩니다.",
  },
  {
    id: "airport",
    time: "약 15분",
    title: "인천국제공항",
    label: "직주근접",
    description: "공항 및 관련 산업 종사자에게 편리한 직주근접 생활권을 제공합니다.",
  },
  {
    id: "yeouido",
    time: "약 30분",
    title: "여의도 방향",
    label: "광역 이동",
    description: "도로 및 교통 상황에 따라 이동시간은 달라질 수 있으며 실제 경로를 반드시 확인해야 합니다.",
  },
];

export default function InteractiveLocation() {
  const [selected, setSelected] = useState(places[0]);

  return (
    <section className="section locationV3" id="location-v3">
      <div className="shell">
        <div className="locationV3Heading">
          <div>
            <p className="sectionEyebrow">CONNECTED LIFESTYLE</p>
            <h2 className="sectionTitle">영종에서 시작되는<br />확장된 생활 반경</h2>
          </div>
          <p className="bodyCopy">
            아래 소요시간은 홍보물의 안내를 바탕으로 한 참고 정보입니다. 출발지·경로·교통상황에 따라 달라질 수 있습니다.
          </p>
        </div>

        <div className="locationV3Panel">
          <div className="locationV3Map" aria-label="영종 교통 연결 개념도">
            <div className="mapWater" aria-hidden="true" />
            <div className="mapRoute" aria-hidden="true" />
            <div className="mapOrigin">
              <span>현재 위치</span>
              <strong>영종 디에트르<br />라 메르</strong>
            </div>

            {places.map((place, index) => (
              <button
                key={place.id}
                type="button"
                className={`mapPoint point${index + 1} ${selected.id === place.id ? "active" : ""}`}
                onClick={() => setSelected(place)}
                aria-pressed={selected.id === place.id}
              >
                <span>{place.time}</span>
                <strong>{place.title}</strong>
              </button>
            ))}
          </div>

          <aside className="locationV3Detail" aria-live="polite">
            <span className="locationV3Badge">{selected.label}</span>
            <strong className="locationV3Time">{selected.time}</strong>
            <h3>{selected.title}</h3>
            <p>{selected.description}</p>
            <button type="button" onClick={() => openLeadModal(`location-${selected.id}`)}>
              입지 상세 상담 <span aria-hidden="true">→</span>
            </button>
          </aside>
        </div>
      </div>
    </section>
  );
}
