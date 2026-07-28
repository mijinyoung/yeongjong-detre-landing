"use client";

import { useState } from "react";
import { openLeadModal, trackEvent } from "@/lib/analytics";

const films = [
  {
    id: "brand",
    eyebrow: "BRAND FILM",
    title: ["스카이라인으로 만나는", "디에트르 라 메르"],
    description:
      "최고 49층의 상징적인 외관과 바다를 품은 주거 가치를 영상으로 확인해 보세요.",
    src: "/videos/brand-film.mp4",
    poster: "/images/video/brand-poster.jpg",
    label: "브랜드 영상",
  },
  {
    id: "complex",
    eyebrow: "COMPLEX FILM",
    title: ["단지의 계획과 공간을", "한 편의 영상으로"],
    description:
      "단지 구성과 커뮤니티, 조경과 세대 계획을 담은 공식 단지 홍보영상입니다.",
    src: "/videos/complex-film.mp4",
    poster: "/images/video/complex-poster.jpg",
    label: "단지 홍보영상",
  },
];

export default function VideoShowcase() {
  const [activeId, setActiveId] = useState(films[0].id);
  const active = films.find((film) => film.id === activeId) || films[0];

  const selectFilm = (id: string) => {
    setActiveId(id);
    trackEvent("video_select", { video_id: id });
  };

  return (
    <section className="section videoShowcase" id="brand-film">
      <div className="shell">
        <div className="videoShowcaseHeading">
          <div>
            <p className="sectionEyebrow">CINEMATIC EXPERIENCE</p>
            <h2 className="sectionTitle">
              영상으로 먼저 만나는
              <br />
              영종 디에트르 라 메르
            </h2>
          </div>
          <p className="bodyCopy">
            드론 전경과 공식 단지 홍보영상을 통해 입지와 스카이라인,
            단지의 주요 계획을 더욱 생생하게 확인할 수 있습니다.
          </p>
        </div>

        <div className="videoShowcasePanel">
          <div className="videoPlayerWrap">
            <video
              key={active.id}
              className="videoPlayer"
              controls
              playsInline
              preload="metadata"
              poster={active.poster}
              onPlay={() =>
                trackEvent("video_play", { video_id: active.id })
              }
              onEnded={() =>
                trackEvent("video_complete", { video_id: active.id })
              }
            >
              <source src={active.src} type="video/mp4" />
              브라우저에서 영상을 재생할 수 없습니다.
            </video>
          </div>

          <aside className="videoShowcaseInfo">
            <p className="videoShowcaseEyebrow">{active.eyebrow}</p>
            <h3>
              {active.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h3>
            <p>{active.description}</p>

            <div className="videoShowcaseTabs" role="tablist" aria-label="영상 선택">
              {films.map((film) => (
                <button
                  key={film.id}
                  type="button"
                  role="tab"
                  aria-selected={active.id === film.id}
                  className={active.id === film.id ? "active" : ""}
                  onClick={() => selectFilm(film.id)}
                >
                  <span>{film.eyebrow}</span>
                  <strong>{film.label}</strong>
                </button>
              ))}
            </div>

            <button
              type="button"
              className="videoShowcaseCta"
              onClick={() => openLeadModal(`video-${active.id}`)}
            >
              영상 상담 신청 <span aria-hidden="true">→</span>
            </button>
          </aside>
        </div>

        <p className="videoShowcaseNote">
          영상은 네트워크 환경에 따라 화질과 로딩 속도가 달라질 수 있습니다.
          모바일에서는 재생 버튼을 눌러 시청해 주세요.
        </p>
      </div>
    </section>
  );
}
