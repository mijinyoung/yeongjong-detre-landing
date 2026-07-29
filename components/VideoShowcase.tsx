"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import { openLeadModal, trackEvent } from "@/lib/analytics";

const films = [
  {
    id: "brand",
    eyebrow: "BRAND FILM",
    title: ["스카이라인으로 만나는", "디에트르 라 메르"],
    description:
      "최고 49층의 상징적인 외관과 바다를 품은 주거 가치를 영상으로 확인해 보세요.",
    src: "/videos/brand-film.mp4?v=95",
    poster: "/images/video/brand-poster-v95.webp",
    label: "브랜드 영상",
  },
  {
    id: "complex",
    eyebrow: "COMPLEX FILM",
    title: ["단지의 계획과 공간을", "한 편의 영상으로"],
    description:
      "단지 구성과 커뮤니티, 조경과 세대 계획을 담은 공식 단지 홍보영상입니다.",
    src: "/videos/complex-film.mp4?v=95",
    poster: "/images/video/complex-poster-v95.webp",
    label: "단지 홍보영상",
  },
];

export default function VideoShowcase() {
  const [activeId, setActiveId] = useState(films[0].id);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const active = films.find((film) => film.id === activeId) || films[0];

  const selectFilm = (id: string) => {
    setActiveId(id);
    trackEvent("video_select", { video_id: id });
  };

  const moveTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex = index;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % films.length;
    else if (event.key === "ArrowLeft") nextIndex = (index - 1 + films.length) % films.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = films.length - 1;
    else return;

    event.preventDefault();
    selectFilm(films[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
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

        <div
          className="videoShowcasePanel"
          id={`video-panel-${active.id}`}
          role="tabpanel"
          aria-labelledby={`video-tab-${active.id}`}
        >
          <div className="videoPlayerWrap">
            <video
              key={active.id}
              className="videoPlayer"
              controls
              playsInline
              preload="none"
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
              {films.map((film, index) => (
                <button
                  key={film.id}
                  ref={(element) => { tabRefs.current[index] = element; }}
                  id={`video-tab-${film.id}`}
                  type="button"
                  role="tab"
                  aria-selected={active.id === film.id}
                  aria-controls={`video-panel-${film.id}`}
                  tabIndex={active.id === film.id ? 0 : -1}
                  className={active.id === film.id ? "active" : ""}
                  onClick={() => selectFilm(film.id)}
                  onKeyDown={(event) => moveTab(event, index)}
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
