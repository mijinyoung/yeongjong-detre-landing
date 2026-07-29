"use client";

import { useEffect, useRef, useState } from "react";
import { openLeadModal, trackEvent } from "@/lib/analytics";
import MobileNavigation from "@/components/MobileNavigation";
import { contactHref, projectConfig } from "@/data/project-config";

const { hero, identity, contact, assets } = projectConfig;

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const openForm = (source: string) => openLeadModal(source);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection?.saveData;

    if (reducedMotion || saveData) {
      const timer = window.setTimeout(() => setPlaybackBlocked(true), 0);
      return () => window.clearTimeout(timer);
    }

    let idleId: number | null = null;
    let fallbackTimer = 0;
    let scheduled = false;
    const idleApi = window as unknown as {
      requestIdleCallback?: (
        callback: IdleRequestCallback,
        options?: IdleRequestOptions,
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    const enableVideo = () => {
      scheduled = false;
      if (!document.hidden) setVideoEnabled(true);
    };
    const scheduleVideo = () => {
      if (scheduled || document.hidden) return;
      scheduled = true;
      if (typeof idleApi.requestIdleCallback === "function") {
        idleId = idleApi.requestIdleCallback(enableVideo, { timeout: 2000 });
      } else {
        fallbackTimer = window.setTimeout(enableVideo, 500);
      }
    };
    const handleVisibility = () => {
      if (!document.hidden) scheduleVideo();
    };

    if (document.readyState === "complete") scheduleVideo();
    else window.addEventListener("load", scheduleVideo, { once: true });
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("load", scheduleVideo);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (idleId !== null) idleApi.cancelIdleCallback?.(idleId);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoEnabled) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.load();

    const syncPlayback = () => {
      if (document.hidden) {
        video.pause();
      } else {
        void video.play()
          .then(() => setPlaybackBlocked(false))
          .catch(() => setPlaybackBlocked(true));
      }
    };

    syncPlayback();
    video.addEventListener("loadeddata", syncPlayback, { once: true });
    document.addEventListener("visibilitychange", syncPlayback);
    return () => {
      document.removeEventListener("visibilitychange", syncPlayback);
      video.removeEventListener("loadeddata", syncPlayback);
      video.pause();
    };
  }, [videoEnabled]);

  async function playVideo() {
    if (!videoEnabled) {
      setVideoEnabled(true);
      await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
    }

    const video = videoRef.current;
    if (!video) return;

    try {
      video.muted = true;
      await video.play();
      setPlaybackBlocked(false);
      trackEvent("hero_video_play", { source: "manual-mobile-play" });
    } catch {
      setPlaybackBlocked(true);
    }
  }

  return (
    <section className="heroV50" id="top">
      <video
        ref={videoRef}
        className="heroV50Video"
        autoPlay={videoEnabled}
        muted
        loop
        playsInline
        preload={videoEnabled ? "metadata" : "none"}
        poster={assets.heroPoster}
        aria-label={hero.videoAriaLabel}
        onPlay={() => setPlaybackBlocked(false)}
        onError={() => setPlaybackBlocked(true)}
      >
        {videoEnabled ? <source src={assets.heroVideo} type="video/mp4" /> : null}
      </video>
      <div className="heroV50StampMask" aria-hidden="true" />
      <div className="heroV50Shade" aria-hidden="true" />
      {playbackBlocked ? (
        <button className="heroV50Play" type="button" onClick={() => void playVideo()}>
          <span aria-hidden="true">▶</span>
          배경 영상 재생
        </button>
      ) : null}

      <header className="heroV50Header shell">
        <a className="heroV50Brand" href="#top" aria-label={`${identity.name} 홈`}>
          <strong>{identity.brandPrimary}</strong>
          <span>{identity.brandSecondary}</span>
        </a>

        <nav className="heroV50Nav" aria-label="주요 메뉴">
          {projectConfig.navigation.filter((item) => item.enabled).map((item) => (
            <a key={item.href} href={item.href}>{item.label}</a>
          ))}
        </nav>

        <MobileNavigation />

        <a
          className="heroV50Phone"
          href={contactHref}
          onClick={() => trackEvent("phone_click", { source: "hero-header" })}
        >
          <small>{contact.label}</small>
          <strong>{contact.displayPhone}</strong>
        </a>
      </header>

      <div className="heroV50Content shell">
        <div className="heroV50Copy">
          <p className="heroV50Eyebrow">{hero.eyebrow}</p>
          <h1>
            {hero.headlineLines.map((line, index) => (
              <span key={line}>
                {line}
                {index < hero.headlineLines.length - 1 ? <br /> : null}
              </span>
            ))}
          </h1>
          <p className="heroV50Project">{identity.name}</p>
          <p className="heroV50Description">
            {hero.descriptionLines.map((line, index) => (
              <span key={line}>
                {line}
                {index < hero.descriptionLines.length - 1 ? <br className="desktopOnly" /> : null}
              </span>
            ))}
          </p>

          <ul className="heroV50Proof" aria-label="단지 핵심 특징">
            {hero.proofPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <div className="heroV50Actions">
            <button type="button" onClick={() => openForm("hero-primary")}> 
              관심고객 등록 <span aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="heroV50Secondary"
              onClick={() => openForm("hero-brochure")}
            >
              분양자료 상담
            </button>
          </div>
        </div>

        <div className="heroV50Vertical" aria-hidden="true">
          <span>{hero.verticalCopy}</span>
        </div>
      </div>

      <div className="heroV50Facts shell" aria-label="핵심 정보">
        {hero.facts.map((fact) => (
          <div key={fact.label}>
            <strong>{fact.value}</strong>
            <span>{fact.label}</span>
          </div>
        ))}
      </div>

      <a className="heroV50Scroll" href="#quick-lead" aria-label="다음 내용으로 이동">
        <span>SCROLL</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
