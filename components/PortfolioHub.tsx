"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import projects from "@/data/projects.json";
import styles from "./PortfolioHub.module.css";

type Project = (typeof projects)[number];

const regionFilters = ["전체", "인천", "경기"] as const;

export default function PortfolioHub() {
  const [region, setRegion] = useState<(typeof regionFilters)[number]>("전체");
  const visibleProjects = useMemo(
    () => projects.filter((project) => region === "전체" || project.region === region),
    [region],
  );
  const years = [...new Set(projects.map((project) => project.year))].sort((a, b) => b - a);

  return (
    <main className={styles.hub} id="main-content">
      <header className={styles.header}>
        <a className={styles.brand} href="#top" aria-label="EXIO 홈">EXIO</a>
        <a className={styles.phone} href="tel:18338384">1833-8384</a>
      </header>

      <section className={styles.hero} id="top" aria-labelledby="hero-title">
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>REAL ESTATE PORTFOLIO</p>
          <h1 id="hero-title">좋은 현장을<br /><span className={styles.desktopLine}>더 빠르게 만나는 방법</span></h1>
          <p>EXIO가 운영하는 분양 현장을<br className={styles.mobileBreak} /> 지역과 연도별로 확인하세요.</p>
          <a className={styles.heroLink} href="#projects">운영 현장 보기 <span aria-hidden="true">↓</span></a>
        </div>
        <div className={styles.heroIndex} aria-hidden="true">
          <span>2026</span><i /><span>EXIO</span>
        </div>
      </section>

      <section className={styles.projectsSection} id="projects" aria-labelledby="projects-title">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>ACTIVE PROJECTS</p>
            <h2 id="projects-title">현재 운영 현장</h2>
          </div>
          <p>운영 중인 현장을 확인하고<br />각 현장의 상세 안내로 이동할 수 있습니다.</p>
        </div>
        <ProjectGrid projects={projects} />
      </section>

      <section className={styles.regionSection} aria-labelledby="region-title">
        <div className={styles.regionHeader}>
          <div>
            <p className={styles.eyebrow}>BY REGION</p>
            <h2 id="region-title">지역별 현장 보기</h2>
          </div>
          <div className={styles.filters} role="tablist" aria-label="지역별 현장 필터">
            {regionFilters.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={region === item}
                className={region === item ? styles.activeFilter : undefined}
                onClick={() => setRegion(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <ProjectGrid projects={visibleProjects} compact />
      </section>

      <section className={styles.archiveSection} aria-labelledby="archive-title">
        <p className={styles.eyebrow}>PROJECT ARCHIVE</p>
        <div className={styles.archiveHeader}>
          <h2 id="archive-title">연도별 프로젝트</h2>
          <p>완료된 현장도 같은 구조로<br />기록하고 관리합니다.</p>
        </div>
        {years.map((year) => (
          <div className={styles.archiveRow} key={year}>
            <strong>{year}</strong>
            <div>
              {projects.filter((project) => project.year === year).map((project) => (
                <span key={project.projectCode}>{project.projectName}<em>{project.status}</em></span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className={styles.aboutSection} aria-labelledby="about-title">
        <p className={styles.eyebrow}>ABOUT EXIO</p>
        <h2 id="about-title">현장과 고객을<br />더 가까이 연결합니다.</h2>
        <p>EXIO는 현장별 정보가 필요한 순간,<br />쉽고 정확하게 닿을 수 있도록 운영합니다.</p>
      </section>

      <footer className={styles.footer}>
        <div><strong>EXIO</strong><span>분양 현장 안내</span></div>
        <a href="tel:18338384">1833-8384</a>
        <small>© {new Date().getFullYear()} EXIO. All rights reserved.</small>
      </footer>
    </main>
  );
}

function ProjectGrid({ projects: items, compact = false }: { projects: readonly Project[]; compact?: boolean }) {
  return (
    <div className={compact ? `${styles.grid} ${styles.compactGrid}` : styles.grid}>
      {items.map((project) => (
        <article className={styles.card} key={project.projectCode}>
          <a href={project.domain} target="_blank" rel="noreferrer" aria-label={`${project.projectName} 현장 보기`}>
            <div className={styles.imageWrap}>
              <Image src={project.thumbnail} alt={`${project.projectName} 대표 이미지`} fill sizes="(max-width: 720px) 100vw, 33vw" />
              <span className={styles.status}>{project.status}</span>
            </div>
            <div className={styles.cardBody}>
              <p>{project.region} · {project.subRegion} <i>{project.year}</i></p>
              <h3>{project.projectName}</h3>
              <span>현장 보기 <b aria-hidden="true">→</b></span>
            </div>
          </a>
        </article>
      ))}
    </div>
  );
}
