"use client";

import { useEffect, useState } from "react";

type HealthData = {
  ok: boolean;
  version: string;
  productionReady?: boolean;
  integrations: {
    googleSheets: boolean;
    sms: boolean;
    metaPixel: boolean;
    googleAnalytics: boolean;
    metaConversionsApi: boolean;
  };
  checkedAt: string;
};

const labels: Array<[keyof HealthData["integrations"], string, string]> = [
  ["googleSheets", "Google Sheets", "관심고객 DB 자동 저장"],
  ["sms", "문자 알림", "신규 문의 담당자 알림"],
  ["metaPixel", "Meta Pixel", "브라우저 광고 전환 측정"],
  ["metaConversionsApi", "Meta CAPI", "서버 광고 전환 측정"],
  ["googleAnalytics", "Google Analytics", "방문 행동 분석"],
];

export default function SystemCheckClient() {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setError("");

    try {
      const response = await fetch("/api/health", { cache: "no-store" });
      if (!response.ok) throw new Error("상태 정보를 불러오지 못했습니다.");
      setData((await response.json()) as HealthData);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "상태 정보를 불러오지 못했습니다.",
      );
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <main className="systemCheckPage">
      <div className="systemCheckShell">
        <p className="systemCheckEyebrow">OPERATION CHECK</p>
        <h1>홈페이지 운영 연결 상태</h1>
        <p className="systemCheckIntro">
          이 화면에는 비밀 키가 표시되지 않으며, 각 연동의 설정 여부만
          보여줍니다.
        </p>

        {error ? <p className="systemCheckError">{error}</p> : null}

        <div className="systemCheckSummary">
          <div>
            <span>현재 버전</span>
            <strong>{data?.version || "확인 중"}</strong>
          </div>
          <div>
            <span>운영 준비</span>
            <strong>
              {data
                ? data.productionReady
                  ? "핵심 연동 완료"
                  : "추가 설정 필요"
                : "확인 중"}
            </strong>
          </div>
        </div>

        <div className="systemCheckGrid">
          {labels.map(([key, title, description]) => {
            const configured = data?.integrations[key] ?? false;

            return (
              <article className="systemCheckCard" key={key}>
                <span
                  className={`systemCheckStatus ${
                    configured ? "configured" : ""
                  }`}
                >
                  {configured ? "연결됨" : "미설정"}
                </span>
                <h2>{title}</h2>
                <p>{description}</p>
              </article>
            );
          })}
        </div>

        <div className="systemCheckActions">
          <button type="button" onClick={() => void load()}>
            상태 새로고침
          </button>
          <a href="/">홈페이지로 돌아가기</a>
        </div>

        <p className="systemCheckFootnote">
          핵심 운영 기준은 Google Sheets와 문자 알림 연결입니다. 광고 분석
          도구는 광고 집행 전에 추가할 수 있습니다.
        </p>
      </div>
    </main>
  );
}
