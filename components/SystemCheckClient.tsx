"use client";

import { useState } from "react";
import Link from "next/link";

type HealthData = {
  ok: boolean;
  version: string;
  productionReady?: boolean;
  advertisingReady?: boolean;
  integrations: {
    siteUrl: boolean;
    googleSheets: boolean;
    sms: boolean;
    metaPixel: boolean;
    googleAnalytics: boolean;
    googleAds: boolean;
    metaConversionsApi: boolean;
    adminSession: boolean;
    liveLeadMode: boolean;
    liveTrackingMode: boolean;
  };
  launchChecks: Array<{
    key: string;
    label: string;
    description: string;
    ready: boolean;
    required: boolean;
  }>;
  checkedAt: string;
  requestId?: string;
};

type TestTarget = "googleSheets" | "sms";

const labels: Array<[keyof HealthData["integrations"], string, string]> = [
  ["siteUrl", "운영 대표 주소", "실제 HTTPS 도메인과 검색·공유 대표 주소"],
  ["googleSheets", "Google Sheets", "관심고객 DB 자동 저장"],
  ["sms", "문자 알림", "신규 문의 담당자 알림 및 시트 상태 기록"],
  ["metaPixel", "Meta Pixel", "브라우저 광고 전환 측정"],
  ["metaConversionsApi", "Meta CAPI", "서버 광고 전환 측정"],
  ["googleAnalytics", "Google Analytics", "방문 행동 분석"],
  ["googleAds", "Google Ads", "상담 완료 전환 측정"],
  ["adminSession", "관리자 보안", "고객정보 보호 로그인·세션·허용 주소"],
  ["liveLeadMode", "실제 접수 모드", "개발용 테스트 모드 해제 여부"],
  ["liveTrackingMode", "실제 광고 전환", "Meta 테스트 이벤트 코드 해제 여부"],
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
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<TestTarget | null>(null);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    leadId?: string;
  } | null>(null);

  async function load() {
    if (!token.trim()) {
      setError("SYSTEM_CHECK_TOKEN을 입력해 주세요.");
      setData(null);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/health", {
        cache: "no-store",
        headers: { "x-system-check-token": token.trim() },
      });
      const result = (await response.json()) as HealthData & { message?: string };
      if (!response.ok || !result.ok) {
        const detail = result.requestId
          ? ` (요청 ID: ${result.requestId})`
          : "";
        throw new Error(
          `${result.message || "상태 정보를 불러오지 못했습니다."}${detail}`,
        );
      }
      setData(result);
    } catch (loadError) {
      setData(null);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "상태 정보를 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
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
        requestId?: string;
      };

      setTestResult({
        ok: Boolean(response.ok && result.ok),
        message:
          (result.message
            ? `${result.message}${
                !response.ok && result.requestId
                  ? ` (요청 ID: ${result.requestId})`
                  : ""
              }`
            : "") ||
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

  return (
    <main className="systemCheckPage" id="main-content">
      <div className="systemCheckShell">
        <p className="systemCheckEyebrow">OPERATION CHECK</p>
        <h1>홈페이지 운영 연결 상태</h1>
        <p className="systemCheckIntro">
          비밀 키의 실제 값은 표시하지 않습니다. 환경변수 설정 여부를 확인하고,
          Google Sheets와 문자 알림에 테스트 데이터를 직접 전송할 수 있습니다.
        </p>

        {error ? <p className="systemCheckError" role="alert">{error}</p> : null}

        <section className="systemAuthSection" aria-labelledby="system-auth-title">
          <div>
            <p className="systemCheckEyebrow">SECURE ACCESS</p>
            <h2 id="system-auth-title">운영 상태 인증</h2>
            <p>연동 설정 정보는 운영 점검 비밀번호 확인 후에만 표시됩니다.</p>
          </div>
          <label className="systemTokenField">
            <span>운영 점검 비밀번호</span>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void load();
              }}
              placeholder="SYSTEM_CHECK_TOKEN"
              autoComplete="current-password"
            />
          </label>
          <button type="button" onClick={() => void load()} disabled={loading}>
            {loading ? "확인 중..." : data ? "상태 새로고침" : "운영 상태 확인"}
          </button>
        </section>

        <div className="systemCheckSummary systemCheckSummaryV130">
          <div>
            <span>현재 버전</span>
            <strong>{data?.version || "인증 필요"}</strong>
          </div>
          <div>
            <span>상담 운영</span>
            <strong>
              {data
                ? data.productionReady
                  ? "핵심 연동 완료"
                  : "추가 설정 필요"
                : "인증 필요"}
            </strong>
          </div>
          <div>
            <span>광고 송출</span>
            <strong>
              {data
                ? data.advertisingReady
                  ? "송출 가능"
                  : "설정 확인 필요"
                : "인증 필요"}
            </strong>
          </div>
        </div>

        {data ? (
          <section className="launchCheckSection" aria-labelledby="launch-check-title">
            <div className="launchCheckHeading">
              <div>
                <p className="systemCheckEyebrow">LAUNCH READINESS</p>
                <h2 id="launch-check-title">광고 송출 전 최종 판정</h2>
              </div>
              <strong className={data.advertisingReady ? "ready" : "attention"}>
                {data.advertisingReady ? "광고 송출 가능" : "설정 확인 필요"}
              </strong>
            </div>
            <div className="launchCheckGrid">
              {data.launchChecks.map((check) => (
                <article className={check.ready ? "ready" : "attention"} key={check.key}>
                  <div>
                    <span>{check.required ? "필수" : "권장"}</span>
                    <strong>{check.ready ? "완료" : "확인 필요"}</strong>
                  </div>
                  <h3>{check.label}</h3>
                  <p>{check.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

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
                  {data ? (configured ? "연결됨" : "미설정") : "인증 필요"}
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
          <button type="button" onClick={() => void load()} disabled={loading}>
            {loading ? "확인 중..." : "상태 새로고침"}
          </button>
          <Link href="/">홈페이지로 돌아가기</Link>
        </div>

        <p className="systemCheckFootnote">
          `/system-check` 주소는 검색엔진에 노출되지 않지만 주소를 아는 사람은
          열 수 있습니다. 점검용 비밀번호는 외부에 공유하지 마세요.
        </p>
      </div>
    </main>
  );
}
