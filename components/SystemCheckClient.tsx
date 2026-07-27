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

type TestTarget = "googleSheets" | "sms";

const labels: Array<[keyof HealthData["integrations"], string, string]> = [
  ["googleSheets", "Google Sheets", "관심고객 DB 자동 저장"],
  ["sms", "문자 알림", "신규 문의 담당자 알림 및 시트 상태 기록"],
  ["metaPixel", "Meta Pixel", "브라우저 광고 전환 측정"],
  ["metaConversionsApi", "Meta CAPI", "서버 광고 전환 측정"],
  ["googleAnalytics", "Google Analytics", "방문 행동 분석"],
];

const setupSteps = [
  {
    number: "01",
    title: "Google Sheets 웹앱 만들기",
    description:
      "integrations/google-apps-script.gs 내용을 Apps Script에 붙여넣고 웹 앱으로 배포합니다.",
  },
  {
    number: "02",
    title: "Vercel 환경변수 입력",
    description:
      "GOOGLE_SHEET_WEBHOOK_URL, SMS_WEBHOOK_URL, WEBHOOK_SECRET를 Production 환경에 저장합니다.",
  },
  {
    number: "03",
    title: "테스트 전송 확인",
    description:
      "아래 점검 버튼을 눌러 스프레드시트 행 추가와 담당자 문자 수신을 각각 확인합니다.",
  },
  {
    number: "04",
    title: "실제 상담폼 최종 점검",
    description:
      "테스트 완료 후 홈페이지에서 본인 번호로 관심고객 등록하고, 관심고객 탭의 문자상태 열까지 확인합니다.",
  },
];

export default function SystemCheckClient() {
  const [data, setData] = useState<HealthData | null>(null);
  const [error, setError] = useState("");
  const [token, setToken] = useState("");
  const [testing, setTesting] = useState<TestTarget | null>(null);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    leadId?: string;
  } | null>(null);

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

  async function runTest(target: TestTarget) {
    if (!token.trim()) {
      setTestResult({
        ok: false,
        message: "Vercel에 설정한 SYSTEM_CHECK_TOKEN을 입력해 주세요.",
      });
      return;
    }

    setTesting(target);
    setTestResult(null);

    try {
      const response = await fetch("/api/integration-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, token: token.trim() }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        message?: string;
        leadId?: string;
      };

      setTestResult({
        ok: Boolean(response.ok && result.ok),
        message:
          result.message ||
          (response.ok
            ? "테스트 전송이 완료되었습니다."
            : "테스트 전송에 실패했습니다."),
        leadId: result.leadId,
      });

      if (response.ok) {
        await load();
      }
    } catch (testError) {
      setTestResult({
        ok: false,
        message:
          testError instanceof Error
            ? testError.message
            : "테스트 전송 중 오류가 발생했습니다.",
      });
    } finally {
      setTesting(null);
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
          비밀 키의 실제 값은 표시하지 않습니다. 환경변수 설정 여부를 확인하고,
          Google Sheets와 문자 알림에 테스트 데이터를 직접 전송할 수 있습니다.
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

        <section className="systemSetupSection">
          <div className="systemSetupHeading">
            <div>
              <p className="systemCheckEyebrow">SETUP GUIDE</p>
              <h2>실제 문의 접수 연결 순서</h2>
            </div>
            <p>
              아래 순서대로 설정하면 상담 신청이 스프레드시트에 저장되고,
              담당자에게 문자로 전달됩니다.
            </p>
          </div>

          <div className="systemSetupSteps">
            {setupSteps.map((step) => (
              <article key={step.number}>
                <span>{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="systemTestSection">
          <div className="systemTestHeading">
            <div>
              <p className="systemCheckEyebrow">LIVE TEST</p>
              <h2>연동 테스트 전송</h2>
            </div>
            <p>
              테스트 시 이름은 ‘연동 테스트’, 번호는 ‘010-0000-0000’으로 전달됩니다. 문자 수신 여부와 Google Sheets의 관심고객 탭을 함께 확인해 주세요.
            </p>
          </div>

          <label className="systemTokenField">
            <span>점검용 비밀번호</span>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="SYSTEM_CHECK_TOKEN"
              autoComplete="off"
            />
          </label>

          <div className="systemTestButtons">
            <button
              type="button"
              disabled={Boolean(testing) || !data?.integrations.googleSheets}
              onClick={() => void runTest("googleSheets")}
            >
              {testing === "googleSheets"
                ? "전송 중..."
                : "Google Sheets 테스트"}
            </button>
            <button
              type="button"
              disabled={Boolean(testing) || !data?.integrations.sms}
              onClick={() => void runTest("sms")}
            >
              {testing === "sms" ? "전송 중..." : "문자 알림 테스트"}
            </button>
          </div>

          {testResult ? (
            <div
              className={`systemTestResult ${
                testResult.ok ? "success" : "failure"
              }`}
              role="status"
            >
              <strong>{testResult.ok ? "성공" : "확인 필요"}</strong>
              <p>{testResult.message}</p>
              {testResult.leadId ? (
                <span>테스트 접수번호: {testResult.leadId}</span>
              ) : null}
            </div>
          ) : null}
        </section>

        <div className="systemCheckActions">
          <button type="button" onClick={() => void load()}>
            상태 새로고침
          </button>
          <a href="/">홈페이지로 돌아가기</a>
        </div>

        <p className="systemCheckFootnote">
          `/system-check` 주소는 검색엔진에 노출되지 않지만 주소를 아는 사람은
          열 수 있습니다. 점검용 비밀번호는 외부에 공유하지 마세요.
        </p>
      </div>
    </main>
  );
}
