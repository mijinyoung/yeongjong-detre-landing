"use client";

import { useMemo, useState } from "react";
import { projectConfig } from "@/data/project-config";

type ChannelPreset = {
  id: string;
  label: string;
  source: string;
  medium: string;
};

const CHANNEL_PRESETS: ChannelPreset[] = [
  { id: "naver", label: "네이버 검색광고", source: "naver", medium: "cpc" },
  { id: "google", label: "Google Ads", source: "google", medium: "cpc" },
  { id: "meta", label: "Meta 광고", source: "meta", medium: "paid_social" },
  { id: "kakao", label: "카카오 광고", source: "kakao", medium: "display" },
  { id: "custom", label: "직접 입력", source: "", medium: "" },
];

const TRACKING_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function buildCampaignUrl(
  baseUrl: string,
  values: Record<(typeof TRACKING_KEYS)[number], string>,
) {
  try {
    const url = new URL(baseUrl.trim());

    TRACKING_KEYS.forEach((key) => {
      const value = values[key].trim();
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    });

    return url.toString();
  } catch {
    return "";
  }
}

export default function CampaignLinkBuilder({ siteUrl }: { siteUrl: string }) {
  const [baseUrl, setBaseUrl] = useState(siteUrl);
  const [channel, setChannel] = useState("naver");
  const [source, setSource] = useState("naver");
  const [medium, setMedium] = useState("cpc");
  const [campaign, setCampaign] = useState(`${projectConfig.projectCode}-launch`);
  const [content, setContent] = useState("creative-a");
  const [term, setTerm] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const generatedUrl = useMemo(
    () =>
      buildCampaignUrl(baseUrl, {
        utm_source: source,
        utm_medium: medium,
        utm_campaign: campaign,
        utm_content: content,
        utm_term: term,
      }),
    [baseUrl, campaign, content, medium, source, term],
  );

  const isComplete = Boolean(
    generatedUrl && source.trim() && medium.trim() && campaign.trim(),
  );

  function selectChannel(presetId: string) {
    setChannel(presetId);
    setCopyStatus("");

    const preset = CHANNEL_PRESETS.find((item) => item.id === presetId);
    if (!preset || preset.id === "custom") return;
    setSource(preset.source);
    setMedium(preset.medium);
  }

  async function copyLink() {
    if (!isComplete) return;

    try {
      await navigator.clipboard.writeText(generatedUrl);
      setCopyStatus("광고 주소를 복사했습니다.");
    } catch {
      setCopyStatus("자동 복사가 차단되었습니다. 아래 주소를 길게 눌러 복사해 주세요.");
    }
  }

  return (
    <section className="campaignBuilder" aria-labelledby="campaign-builder-title">
      <div className="campaignBuilderHeading">
        <div>
          <span>CAMPAIGN URL BUILDER</span>
          <h2 id="campaign-builder-title">광고 송출 주소 만들기</h2>
        </div>
        <p>
          매체와 캠페인명을 입력하면 유입경로가 자동 기록되는 주소를 만듭니다.
          광고마다 소재명만 다르게 입력하면 성과를 정확히 비교할 수 있습니다.
        </p>
      </div>

      <div className="campaignBuilderGrid">
        <label>
          <span>광고 매체</span>
          <select value={channel} onChange={(event) => selectChannel(event.target.value)}>
            {CHANNEL_PRESETS.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.label}
              </option>
            ))}
          </select>
        </label>

        <label className="campaignBuilderWide">
          <span>홈페이지 주소</span>
          <input
            type="url"
            inputMode="url"
            value={baseUrl}
            onChange={(event) => {
              setBaseUrl(event.target.value);
              setCopyStatus("");
            }}
            placeholder="https://홈페이지주소"
          />
        </label>

        <label>
          <span>유입경로</span>
          <input
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setChannel("custom");
              setCopyStatus("");
            }}
            placeholder="naver"
          />
        </label>

        <label>
          <span>매체유형</span>
          <input
            value={medium}
            onChange={(event) => {
              setMedium(event.target.value);
              setChannel("custom");
              setCopyStatus("");
            }}
            placeholder="cpc"
          />
        </label>

        <label>
          <span>캠페인명 (필수)</span>
          <input
            value={campaign}
            onChange={(event) => {
              setCampaign(event.target.value);
              setCopyStatus("");
            }}
            placeholder="yeongjong-launch"
          />
        </label>

        <label>
          <span>광고소재명</span>
          <input
            value={content}
            onChange={(event) => {
              setContent(event.target.value);
              setCopyStatus("");
            }}
            placeholder="creative-a"
          />
        </label>

        <label>
          <span>검색어 (선택)</span>
          <input
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setCopyStatus("");
            }}
            placeholder="영종 분양"
          />
        </label>
      </div>

      <div className="campaignBuilderResult">
        <label>
          <span>완성된 광고 주소</span>
          <textarea
            value={generatedUrl}
            readOnly
            rows={3}
            aria-describedby="campaign-builder-status"
          />
        </label>
        <div className="campaignBuilderActions">
          <button type="button" onClick={() => void copyLink()} disabled={!isComplete}>
            광고 주소 복사
          </button>
          <a
            href={isComplete ? generatedUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!isComplete}
            tabIndex={isComplete ? 0 : -1}
          >
            새 창에서 점검
          </a>
        </div>
        <p
          id="campaign-builder-status"
          className={isComplete ? "complete" : "incomplete"}
          role="status"
          aria-live="polite"
        >
          {copyStatus ||
            (isComplete
              ? "송출 가능한 주소입니다. 광고 관리자에 그대로 붙여넣으세요."
              : "홈페이지 주소, 유입경로, 매체유형, 캠페인명을 확인해 주세요.")}
        </p>
      </div>
    </section>
  );
}
