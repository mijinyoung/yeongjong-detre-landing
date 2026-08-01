"use client";

import { useMemo, useState } from "react";

export type PerformanceLead = {
  submittedAt: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  status: string;
};

type Period = "7" | "30" | "90" | "all";

type CampaignPerformance = {
  key: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  total: number;
  progressed: number;
  consultations: number;
  visits: number;
  contracts: number;
  latestAt: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PROGRESSED_STATUSES = new Set(["연락완료", "상담중", "방문예약", "계약"]);
const CONSULTATION_STATUSES = new Set(["상담중", "방문예약", "계약"]);
const VISIT_STATUSES = new Set(["방문예약", "계약"]);

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value: string) {
  const date = parseDate(value);
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatRate(count: number, total: number) {
  return total ? `${Math.round((count / total) * 100)}%` : "0%";
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

function getSignal(item: CampaignPerformance) {
  if (item.total < 5) return { label: "표본 축적 중", className: "sample" };
  if (item.contracts > 0 || item.visits > 0 || item.consultations / item.total >= 0.4) {
    return { label: "상담 반응 양호", className: "strong" };
  }
  if (item.progressed / item.total >= 0.4) {
    return { label: "계속 관찰", className: "steady" };
  }
  if (item.consultations === 0) return { label: "소재·타겟 점검", className: "attention" };
  return { label: "계속 관찰", className: "steady" };
}

export default function CampaignPerformanceReport({
  leads,
  referenceTime,
}: {
  leads: PerformanceLead[];
  referenceTime: number;
}) {
  const [period, setPeriod] = useState<Period>("30");

  const periodLeads = useMemo(() => {
    if (period === "all") return leads;
    const cutoff = referenceTime - Number(period) * DAY_MS;
    return leads.filter((lead) => {
      const date = parseDate(lead.submittedAt);
      return date ? date.getTime() >= cutoff : false;
    });
  }, [leads, period, referenceTime]);

  const campaignPerformance = useMemo(() => {
    const values = new Map<string, CampaignPerformance>();

    for (const lead of periodLeads) {
      const source = lead.source?.trim() || "direct";
      const medium = lead.medium?.trim() || "";
      const campaign = lead.campaign?.trim() || "캠페인 미지정";
      const content = lead.content?.trim() || "소재 미지정";
      const key = [source, medium, campaign, content].join("|||");
      const existing = values.get(key) || {
        key,
        source,
        medium,
        campaign,
        content,
        total: 0,
        progressed: 0,
        consultations: 0,
        visits: 0,
        contracts: 0,
        latestAt: "",
      };

      existing.total += 1;
      if (PROGRESSED_STATUSES.has(lead.status)) existing.progressed += 1;
      if (CONSULTATION_STATUSES.has(lead.status)) existing.consultations += 1;
      if (VISIT_STATUSES.has(lead.status)) existing.visits += 1;
      if (lead.status === "계약") existing.contracts += 1;

      const submitted = parseDate(lead.submittedAt)?.getTime() || 0;
      const latest = parseDate(existing.latestAt)?.getTime() || 0;
      if (submitted > latest) existing.latestAt = lead.submittedAt;
      values.set(key, existing);
    }

    return [...values.values()].sort(
      (a, b) =>
        b.total - a.total ||
        b.consultations - a.consultations ||
        b.visits - a.visits,
    );
  }, [periodLeads]);

  const keywordPerformance = useMemo(() => {
    const values = new Map<string, {
      term: string;
      total: number;
      consultations: number;
      visits: number;
    }>();

    for (const lead of periodLeads) {
      const term = lead.term?.trim();
      if (!term) continue;
      const existing = values.get(term) || {
        term,
        total: 0,
        consultations: 0,
        visits: 0,
      };
      existing.total += 1;
      if (CONSULTATION_STATUSES.has(lead.status)) existing.consultations += 1;
      if (VISIT_STATUSES.has(lead.status)) existing.visits += 1;
      values.set(term, existing);
    }

    return [...values.values()]
      .sort((a, b) => b.total - a.total || b.consultations - a.consultations)
      .slice(0, 10);
  }, [periodLeads]);

  const summary = useMemo(() => ({
    total: periodLeads.length,
    progressed: periodLeads.filter((lead) => PROGRESSED_STATUSES.has(lead.status)).length,
    visits: periodLeads.filter((lead) => VISIT_STATUSES.has(lead.status)).length,
    contracts: periodLeads.filter((lead) => lead.status === "계약").length,
  }), [periodLeads]);

  function downloadReport() {
    const headers = [
      "유입경로", "매체유형", "캠페인", "광고소재", "문의수",
      "상담진행", "상담진행률", "심화상담", "방문예약", "계약", "최근접수",
    ];
    const rows = campaignPerformance.map((item) => [
      item.source,
      item.medium,
      item.campaign,
      item.content,
      item.total,
      item.progressed,
      formatRate(item.progressed, item.total),
      item.consultations,
      item.visits,
      item.contracts,
      item.latestAt,
    ]);
    const csv = "\uFEFF" + [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `campaign-performance-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="campaignPerformance" aria-labelledby="campaign-performance-title">
      <div className="campaignPerformanceHeading">
        <div>
          <span>CAMPAIGN QUALITY</span>
          <h2 id="campaign-performance-title">광고 유입·상담 성과</h2>
          <p>매체·캠페인·광고소재별로 실제 상담 진행과 방문예약을 비교합니다.</p>
        </div>
        <div className="campaignPerformanceControls">
          <label>
            <span>분석 기간</span>
            <select value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
              <option value="7">최근 7일</option>
              <option value="30">최근 30일</option>
              <option value="90">최근 90일</option>
              <option value="all">전체 기간</option>
            </select>
          </label>
          <button type="button" onClick={downloadReport} disabled={!campaignPerformance.length}>
            성과 CSV 내려받기
          </button>
        </div>
      </div>

      <div className="campaignPerformanceSummary">
        <article><span>문의</span><strong>{summary.total.toLocaleString("ko-KR")}</strong></article>
        <article><span>상담 진행</span><strong>{summary.progressed.toLocaleString("ko-KR")}</strong><small>{formatRate(summary.progressed, summary.total)}</small></article>
        <article><span>방문예약</span><strong>{summary.visits.toLocaleString("ko-KR")}</strong><small>{formatRate(summary.visits, summary.total)}</small></article>
        <article><span>계약</span><strong>{summary.contracts.toLocaleString("ko-KR")}</strong><small>{formatRate(summary.contracts, summary.total)}</small></article>
      </div>

      <div className="campaignPerformanceTableWrap" role="region" aria-label="캠페인별 상담 성과" tabIndex={0}>
        <table className="campaignPerformanceTable">
          <caption className="srOnly">매체·캠페인·광고소재별 문의와 상담 성과</caption>
          <thead>
            <tr>
              <th>유입경로</th><th>캠페인·소재</th><th>문의</th><th>상담 진행</th>
              <th>심화상담</th><th>방문예약</th><th>계약</th><th>반응 판정</th><th>최근</th>
            </tr>
          </thead>
          <tbody>
            {campaignPerformance.map((item) => {
              const signal = getSignal(item);
              return (
                <tr key={item.key}>
                  <td data-label="유입경로"><strong>{item.source === "direct" ? "직접 방문" : item.source}</strong><small>{item.medium || "-"}</small></td>
                  <td data-label="캠페인·소재"><strong>{item.campaign}</strong><small>{item.content}</small></td>
                  <td data-label="문의"><strong>{item.total}</strong></td>
                  <td data-label="상담 진행"><strong>{item.progressed}</strong><small>{formatRate(item.progressed, item.total)}</small></td>
                  <td data-label="심화상담">{item.consultations}</td>
                  <td data-label="방문예약">{item.visits}</td>
                  <td data-label="계약">{item.contracts}</td>
                  <td data-label="반응 판정"><span className={`campaignSignal ${signal.className}`}>{signal.label}</span></td>
                  <td data-label="최근">{formatDate(item.latestAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!campaignPerformance.length ? <p className="campaignPerformanceEmpty">선택한 기간에 접수된 데이터가 없습니다.</p> : null}
      </div>

      <div className="keywordPerformance">
        <div>
          <span>SEARCH KEYWORD</span>
          <h3>검색어 반응</h3>
        </div>
        {keywordPerformance.length ? (
          <ol>
            {keywordPerformance.map((item) => (
              <li key={item.term}>
                <strong>{item.term}</strong>
                <span>문의 {item.total} · 심화상담 {item.consultations} · 방문 {item.visits}</span>
              </li>
            ))}
          </ol>
        ) : <p>검색어 UTM 데이터가 들어오면 여기에 표시됩니다.</p>}
      </div>

      <p className="campaignPerformanceNote">
        반응 판정은 관리자 화면에서 불러온 최근 200건과 저장된 상담 상태를 기준으로 합니다. 광고비 데이터가 포함되지 않으므로 비용 효율 판정은 각 광고 매체의 지출 내역과 함께 확인해 주세요.
      </p>
    </section>
  );
}
