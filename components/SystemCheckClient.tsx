"use client";

import { useState } from "react";
import Link from "next/link";

type HealthData = {
  ok: boolean;
  version: string;
  productionReady?: boolean;
  advertisingReady?: boolean;
  trackingMode?: "direct" | "gtm";
  integrations: {
    siteUrl: boolean;
    customDomain: boolean;
    domainConnection: boolean;
    googleSheets: boolean;
    sms: boolean;
    metaPixel: boolean;
    googleAnalytics: boolean;
    googleTagManager: boolean;
    googleSearchConsole: boolean;
    naverSearchAdvisor: boolean;
    kakaoPixel: boolean;
    naverAdsTracking: boolean;
    googleAds: boolean;
    metaConversionsApi: boolean;
    adminSession: boolean;
    liveLeadMode: boolean;
    liveTrackingMode: boolean;
  };
  domain: {
    configuredUrl: string;
    configuredHost: string;
    currentUrl: string;
    currentHost: string;
    customDomain: boolean;
    https: boolean;
    hostMatches: boolean;
    connected: boolean;
    canonicalUrl: string;
    sitemapUrl: string;
    robotsUrl: string;
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
  ["customDomain", "자체 도메인", "Vercel 기본 주소가 아닌 구매한 광고용 도메인"],
  ["domainConnection", "도메인·HTTPS", "현재 접속 주소와 대표주소 일치 및 보안 연결"],
  ["googleSheets", "Google Sheets", "관심고객 DB 자동 저장"],
  ["sms", "문자 알림", "신규 문의 담당자 알림 및 시트 상태 기록"],
  ["metaPixel", "Meta Pixel", "브라우저 광고 전환 측정"],
  ["metaConversionsApi", "Meta CAPI", "서버 광고 전환 측정"],
  ["googleAnalytics", "Google Analytics", "방문 행동 분석"],
  ["googleTagManager", "Google Tag Manager", "통합 태그와 문의 완료 이벤트 전달"],
  ["kakaoPixel", "카카오 픽셀", "카카오 잠재고객·상담신청 전환 측정"],
  ["naverAdsTracking", "네이버 광고 전환", "검색광고·GFA 신청완료 전환 측정"],
  ["googleSearchConsole", "Google 검색 등록", "소유확인과 현재 홈페이지 색인 관리"],
  ["naverSearchAdvisor", "네이버 검색 등록", "소유확인과 사이트맵 수집 관리"],
  ["googleAds", "Google Ads", "상담 완료 전환 측정"],
  ["adminSession", "관리자 보안", "고객정보 보호 로그인·세션·허용 주소"],
  ["liveLeadMode", "실제 접수 모드", "개발용 테스트 모드 해제 여부"],
  ["liveTrackingMode", "실제 광고 전환", "Meta 테스트 이벤트 코드 해제 여부"],
];

const setupSteps = [
  {
    number: "01",
    title: "Vercel에 도메인 추가",
    description:
      "Vercel 프로젝트의 Settings → Domains에서 결제한 도메인을 추가하고 Primary로 지정합니다.",
  },
  {
    number: "02",
    title: "도메인 업체 DNS 연결",
    description:
      "Vercel 화면에 표시되는 DNS 값을 도메인 구입처에 그대로 등록하고 Valid Configuration을 기다립니다.",
  },
  {
    number: "03",
    title: "대표주소 환경변수 변경",
    description:
      "NEXT_PUBLIC_SITE_URL과 ADMIN_ALLOWED_ORIGINS를 새 HTTPS 도메인으로 변경한 뒤 재배포합니다.",
  },
  {
    number: "04",
    title: "새 도메인에서 최종 점검",
    description:
      "구매한 도메인의 /system-check에서 연결 상태와 시트·문자 테스트를 확인한 후 실제 폼을 접수합니다.",
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

        <div className="systemCheckSummary systemCheckSummaryV190">
          <div>
            <span>현재 버전</span>
            <strong>{data?.version || "인증 필요"}</strong>
          </div>
          <div>
            <span>도메인 연결</span>
            <strong>
              {data
                ? data.domain.connected
                  ? "HTTPS 연결 완료"
                  : "연결 확인 필요"
                : "인증 필요"}
            </strong>
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
          <section className="domainCheckSection" aria-labelledby="domain-check-title">
            <div className="domainCheckHeading">
              <div>
                <p className="systemCheckEyebrow">CUSTOM DOMAIN</p>
                <h2 id="domain-check-title">도메인 연결 결과</h2>
              </div>
              <strong className={data.domain.connected ? "ready" : "attention"}>
                {data.domain.connected ? "연결 완료" : "설정 확인 필요"}
              </strong>
            </div>
            <div className="domainCheckGrid">
              <article>
                <span>Vercel 대표주소</span>
                <strong>{data.domain.configuredUrl || "미설정"}</strong>
                <p>{data.domain.customDomain ? "자체 도메인 확인" : "Vercel 기본 주소 또는 임시 주소"}</p>
              </article>
              <article>
                <span>현재 접속주소</span>
                <strong>{data.domain.currentUrl || "확인 불가"}</strong>
                <p>{data.domain.hostMatches ? "대표주소와 일치" : "대표주소와 다름"}</p>
              </article>
              <article>
                <span>HTTPS 보안 연결</span>
                <strong>{data.domain.https ? "적용됨" : "적용 필요"}</strong>
                <p>{data.domain.connected ? "광고 연결에 사용할 수 있습니다." : "구매한 도메인으로 다시 접속해 확인하세요."}</p>
              </article>
            </div>
            {data.domain.connected ? (
              <div className="domainCheckLinks">
                <a href={data.domain.canonicalUrl} target="_blank" rel="noreferrer">대표 홈페이지</a>
                <a href={data.domain.sitemapUrl} target="_blank" rel="noreferrer">사이트맵 확인</a>
                <a href={data.domain.robotsUrl} target="_blank" rel="noreferrer">검색 설정 확인</a>
              </div>
            ) : null}
          </section>
        ) : null}

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
              <h2>새 도메인 연결 순서</h2>
            </div>
            <p>
              구매한 도메인을 Vercel 대표주소로 연결하고 광고에 사용하기 위한
              순서입니다.
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
