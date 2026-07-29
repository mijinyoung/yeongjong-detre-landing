"use client";

import { useEffect, useRef } from "react";
import { openLeadModal, trackEvent } from "@/lib/analytics";
import MobileNavigation from "@/components/MobileNavigation";
import { contactHref, projectConfig } from "@/data/project-config";

const { hero, identity, contact, assets } = projectConfig;

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const openForm = (source: string) => openLeadModal(source);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("webkit-playsinline", "");
    video.setAttribute("x5-playsinline", "");
    video.setAttribute("autoplay", "");
    video.controls = false;

    const tryAutoplay = () => {
      if (document.hidden) {
        video.pause();
        return;
      }

      video.muted = true;
      void video.play().catch(() => undefined);
    };

    tryAutoplay();
    const retryTimer = window.setInterval(tryAutoplay, 750);
    const stopRetryTimer = window.setTimeout(
      () => window.clearInterval(retryTimer),
      8000,
    );

    video.addEventListener("loadedmetadata", tryAutoplay);
    video.addEventListener("canplay", tryAutoplay);
    video.addEventListener("canplaythrough", tryAutoplay);
    window.addEventListener("pageshow", tryAutoplay);
    document.addEventListener("visibilitychange", tryAutoplay);
    document.addEventListener("touchstart", tryAutoplay, { passive: true });
    document.addEventListener("pointerdown", tryAutoplay, { passive: true });
    document.addEventListener("scroll", tryAutoplay, { passive: true });

    return () => {
      window.clearInterval(retryTimer);
      window.clearTimeout(stopRetryTimer);
      video.removeEventListener("loadedmetadata", tryAutoplay);
      video.removeEventListener("canplay", tryAutoplay);
      video.removeEventListener("canplaythrough", tryAutoplay);
      window.removeEventListener("pageshow", tryAutoplay);
      document.removeEventListener("visibilitychange", tryAutoplay);
      document.removeEventListener("touchstart", tryAutoplay);
      document.removeEventListener("pointerdown", tryAutoplay);
      document.removeEventListener("scroll", tryAutoplay);
      video.pause();
    };
  }, []);

  return (
    <section className="heroV50" id="top">
      <video
        ref={videoRef}
        className="heroV50Video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster={assets.heroPoster}
        aria-hidden="true"
        disablePictureInPicture
        disableRemotePlayback
      >
        <source src={assets.heroVideo} type="video/mp4" />
      </video>
      <div className="heroV50StampMask" aria-hidden="true" />
      <div className="heroV50Shade" aria-hidden="true" />

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
