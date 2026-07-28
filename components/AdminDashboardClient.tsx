"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type Lead = {
  leadId: string;
  submittedAt: string;
  name: string;
  phone: string;
  source: string;
  campaign: string;
  placement: string;
  status: string;
  smsStatus: string;
  memo: string;
};

type DashboardResponse = {
  ok?: boolean;
  message?: string;
  requestId?: string;
  leads?: Lead[];
  total?: number;
  updatedAt?: string;
};

const STATUS_OPTIONS = ["신규", "연락완료", "상담중", "방문예약", "계약", "보류"];

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export default function AdminDashboardClient() {
  const [token, setToken] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, { status: string; memo: string }>>({});
  const [savingId, setSavingId] = useState("");
  const [savedId, setSavedId] = useState("");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesKeyword =
        !keyword ||
        [lead.leadId, lead.name, lead.phone, lead.source, lead.campaign, lead.placement, lead.status, lead.smsStatus, lead.memo]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "new" && (!lead.status || lead.status === "신규")) ||
        (statusFilter === "sms-failed" && lead.smsStatus === "실패") ||
        (statusFilter.startsWith("status:") && lead.status === statusFilter.slice(7));
      return matchesKeyword && matchesStatus;
    });
  }, [leads, query, statusFilter]);

  const todayCount = useMemo(() => {
    const today = new Date().toLocaleDateString("ko-KR");
    return leads.filter((lead) => {
      const date = new Date(lead.submittedAt);
      return !Number.isNaN(date.getTime()) && date.toLocaleDateString("ko-KR") === today;
    }).length;
  }, [leads]);

  const pendingCount = useMemo(
    () => leads.filter((lead) => !lead.status || lead.status === "신규").length,
    [leads],
  );
  const failedSmsCount = useMemo(
    () => leads.filter((lead) => lead.smsStatus === "실패").length,
    [leads],
  );

  async function loadLeads() {
    if (!token.trim()) {
      setMessage("관리자 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setMessage("");
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
        cache: "no-store",
        signal: controller.signal,
      });
      const raw = await response.text();
      let result: DashboardResponse = {};
      try {
        result = raw ? (JSON.parse(raw) as DashboardResponse) : {};
      } catch {
        throw new Error("관리자 서버 응답을 확인할 수 없습니다.");
      }
      if (!response.ok || !result.ok) throw new Error(result.message || "불러오기에 실패했습니다.");

      const nextLeads = result.leads || [];
      setLeads(nextLeads);
      setDrafts(
        Object.fromEntries(
          nextLeads.map((lead) => [
            lead.leadId,
            { status: lead.status || "신규", memo: lead.memo || "" },
          ]),
        ),
      );
      setTotal(result.total || 0);
      setUpdatedAt(result.updatedAt || "");
      setLoaded(true);
    } catch (error) {
      const fallback =
        error instanceof DOMException && error.name === "AbortError"
          ? "접수 현황 요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
          : error instanceof Error
            ? error.message
            : "불러오기에 실패했습니다.";
      setMessage(fallback);
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }

  function updateDraft(leadId: string, patch: Partial<{ status: string; memo: string }>) {
    setDrafts((current) => ({
      ...current,
      [leadId]: {
        status: current[leadId]?.status || "신규",
        memo: current[leadId]?.memo || "",
        ...patch,
      },
    }));
    setSavedId("");
    setSaveMessage("");
  }

  async function saveLead(lead: Lead) {
    const draft = drafts[lead.leadId] || {
      status: lead.status || "신규",
      memo: lead.memo || "",
    };

    setSavingId(lead.leadId);
    setSavedId("");
    setSaveMessage("");

    try {
      const response = await fetch("/api/admin/leads/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim(),
          leadId: lead.leadId,
          status: draft.status,
          memo: draft.memo,
        }),
        cache: "no-store",
      });
      const result = (await response.json()) as DashboardResponse;
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "상담 정보를 저장하지 못했습니다.");
      }

      setLeads((current) =>
        current.map((item) =>
          item.leadId === lead.leadId
            ? { ...item, status: draft.status, memo: draft.memo.trim() }
            : item,
        ),
      );
      setSavedId(lead.leadId);
      setSaveMessage(`${lead.name || "고객"}님의 상담 정보를 저장했습니다.`);
    } catch (error) {
      setSaveMessage(
        error instanceof Error ? error.message : "상담 정보를 저장하지 못했습니다.",
      );
    } finally {
      setSavingId("");
    }
  }

  function downloadCsv() {
    const headers = ["접수번호", "등록일시", "이름", "휴대폰", "유입경로", "캠페인", "신청위치", "처리상태", "상담메모", "문자상태"];
    const rows = filtered.map((lead) => [
      lead.leadId, lead.submittedAt, lead.name, lead.phone, lead.source,
      lead.campaign, lead.placement, lead.status, lead.memo, lead.smsStatus,
    ]);
    const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `yeongjong-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="adminPage" id="main-content">
      <div className="adminShell">
        <header className="adminHeader">
          <div>
            <p>YEONGJONG DETRE · ADMIN</p>
            <h1>관심고객 접수 현황</h1>
            <span>최근 200건을 Google Sheets에서 안전하게 불러옵니다.</span>
          </div>
          <Link href="/">홈페이지 보기</Link>
        </header>

        <section className="adminLogin">
          <label>
            <span>관리자 비밀번호</span>
            <input aria-describedby="admin-token-help" type="password" value={token} onChange={(event) => setToken(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void loadLeads(); }} autoComplete="current-password" placeholder="ADMIN_DASHBOARD_TOKEN" />
          </label>
          <small id="admin-token-help">Vercel에 설정한 관리자 비밀번호를 입력하세요.</small>
          <button type="button" onClick={() => void loadLeads()} disabled={loading}>
            {loading ? "불러오는 중..." : loaded ? "새로고침" : "접수 현황 열기"}
          </button>
        </section>

        {message ? <p className="adminMessage" role="alert">{message}</p> : null}
        <p className="adminSaveNotice" aria-live="polite">{saveMessage}</p>

        {loaded ? (
          <>
            <section className="adminStats">
              <article><span>전체 누적</span><strong>{total.toLocaleString("ko-KR")}</strong></article>
              <article><span>오늘 접수</span><strong>{todayCount.toLocaleString("ko-KR")}</strong></article>
              <article><span>신규 상담</span><strong>{pendingCount.toLocaleString("ko-KR")}</strong></article>
              <article className={failedSmsCount ? "attention" : ""}><span>문자 확인 필요</span><strong>{failedSmsCount.toLocaleString("ko-KR")}</strong></article>
              <article><span>최근 갱신</span><strong>{formatDate(updatedAt)}</strong></article>
            </section>

            <section className="adminToolbar">
              <input aria-label="접수 목록 검색" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 전화번호, 유입경로 검색" />
              <select aria-label="접수 상태 필터" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">전체 상태</option>
                <option value="new">신규 상담</option>
                <option value="status:연락완료">연락완료</option>
                <option value="status:상담중">상담중</option>
                <option value="status:방문예약">방문예약</option>
                <option value="status:계약">계약</option>
                <option value="status:보류">보류</option>
                <option value="sms-failed">문자 실패</option>
              </select>
              <span aria-live="polite">표시 {filtered.length.toLocaleString("ko-KR")}건</span>
              <button type="button" onClick={downloadCsv} disabled={!filtered.length}>CSV 내려받기</button>
            </section>

            <section className="adminTableWrap">
              <table>
                <caption className="srOnly">최근 관심고객 접수 목록</caption>
                <thead><tr><th>등록일시</th><th>이름</th><th>휴대폰</th><th>유입경로</th><th>신청위치</th><th>상태</th><th>상담 메모</th><th>문자</th><th>저장</th></tr></thead>
                <tbody>
                  {filtered.map((lead) => {
                    const draft = drafts[lead.leadId] || {
                      status: lead.status || "신규",
                      memo: lead.memo || "",
                    };
                    const changed =
                      draft.status !== (lead.status || "신규") ||
                      draft.memo.trim() !== (lead.memo || "").trim();

                    return (
                    <tr key={lead.leadId} className={savedId === lead.leadId ? "saved" : ""}>
                      <td><small>{lead.leadId}</small>{formatDate(lead.submittedAt)}</td>
                      <td><strong>{lead.name || "-"}</strong></td>
                      <td><a href={`tel:${lead.phone.replaceAll("-", "")}`}>{lead.phone || "-"}</a></td>
                      <td>{lead.source || lead.campaign || "직접 방문"}</td>
                      <td>{lead.placement || "-"}</td>
                      <td>
                        <select
                          className="adminStatusSelect"
                          aria-label={`${lead.name || "고객"} 처리 상태`}
                          value={draft.status}
                          onChange={(event) => updateDraft(lead.leadId, { status: event.target.value })}
                        >
                          {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </td>
                      <td>
                        <textarea
                          className="adminMemo"
                          aria-label={`${lead.name || "고객"} 상담 메모`}
                          value={draft.memo}
                          maxLength={1000}
                          placeholder="상담 내용 입력"
                          onChange={(event) => updateDraft(lead.leadId, { memo: event.target.value })}
                        />
                      </td>
                      <td><span className={`adminBadge ${lead.smsStatus === "실패" ? "failed" : ""}`}>{lead.smsStatus || "-"}</span></td>
                      <td>
                        <button
                          className="adminSaveButton"
                          type="button"
                          disabled={!changed || savingId === lead.leadId}
                          onClick={() => void saveLead(lead)}
                        >
                          {savingId === lead.leadId ? "저장 중" : savedId === lead.leadId ? "완료" : "저장"}
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              {!filtered.length ? (
                <p className="adminEmpty">
                  {leads.length ? "검색 조건에 맞는 접수가 없습니다." : "아직 접수된 관심고객이 없습니다."}
                </p>
              ) : null}
            </section>
          </>
        ) : null}

        <p className="adminFootnote">관리자 주소와 비밀번호를 외부에 공유하지 마세요. 고객정보 확인 후에는 브라우저 창을 닫아 주세요.</p>
      </div>
    </main>
  );
}
