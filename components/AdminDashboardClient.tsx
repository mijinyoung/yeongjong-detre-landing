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
};

type DashboardResponse = {
  ok?: boolean;
  message?: string;
  leads?: Lead[];
  total?: number;
  updatedAt?: string;
};

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
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return leads;
    return leads.filter((lead) =>
      [lead.leadId, lead.name, lead.phone, lead.source, lead.campaign, lead.status]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }, [leads, query]);

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

  async function loadLeads() {
    if (!token.trim()) {
      setMessage("관리자 비밀번호를 입력해 주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token.trim() }),
        cache: "no-store",
      });
      const raw = await response.text();
      let result: DashboardResponse = {};
      try {
        result = raw ? (JSON.parse(raw) as DashboardResponse) : {};
      } catch {
        throw new Error("관리자 서버 응답을 확인할 수 없습니다.");
      }
      if (!response.ok || !result.ok) throw new Error(result.message || "불러오기에 실패했습니다.");

      setLeads(result.leads || []);
      setTotal(result.total || 0);
      setUpdatedAt(result.updatedAt || "");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "불러오기에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    const headers = ["접수번호", "등록일시", "이름", "휴대폰", "유입경로", "캠페인", "신청위치", "처리상태", "문자상태"];
    const rows = filtered.map((lead) => [
      lead.leadId, lead.submittedAt, lead.name, lead.phone, lead.source,
      lead.campaign, lead.placement, lead.status, lead.smsStatus,
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
            {loading ? "불러오는 중..." : leads.length ? "새로고침" : "접수 현황 열기"}
          </button>
        </section>

        {message ? <p className="adminMessage" role="alert">{message}</p> : null}

        {leads.length ? (
          <>
            <section className="adminStats">
              <article><span>전체 누적</span><strong>{total.toLocaleString("ko-KR")}</strong></article>
              <article><span>오늘 접수</span><strong>{todayCount.toLocaleString("ko-KR")}</strong></article>
              <article><span>신규 상담</span><strong>{pendingCount.toLocaleString("ko-KR")}</strong></article>
              <article><span>최근 갱신</span><strong>{formatDate(updatedAt)}</strong></article>
            </section>

            <section className="adminToolbar">
              <input aria-label="접수 목록 검색" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 전화번호, 유입경로 검색" />
              <button type="button" onClick={downloadCsv}>CSV 내려받기</button>
            </section>

            <section className="adminTableWrap">
              <table>
                <caption className="srOnly">최근 관심고객 접수 목록</caption>
                <thead><tr><th>등록일시</th><th>이름</th><th>휴대폰</th><th>유입경로</th><th>신청위치</th><th>상태</th><th>문자</th></tr></thead>
                <tbody>
                  {filtered.map((lead) => (
                    <tr key={lead.leadId}>
                      <td><small>{lead.leadId}</small>{formatDate(lead.submittedAt)}</td>
                      <td><strong>{lead.name || "-"}</strong></td>
                      <td><a href={`tel:${lead.phone.replaceAll("-", "")}`}>{lead.phone || "-"}</a></td>
                      <td>{lead.source || lead.campaign || "직접 방문"}</td>
                      <td>{lead.placement || "-"}</td>
                      <td><span className={`adminBadge ${lead.status === "신규" ? "new" : ""}`}>{lead.status || "신규"}</span></td>
                      <td><span className={`adminBadge ${lead.smsStatus === "실패" ? "failed" : ""}`}>{lead.smsStatus || "-"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filtered.length ? <p className="adminEmpty">검색 결과가 없습니다.</p> : null}
            </section>
          </>
        ) : null}

        <p className="adminFootnote">관리자 주소와 비밀번호를 외부에 공유하지 마세요. 고객정보 확인 후에는 브라우저 창을 닫아 주세요.</p>
      </div>
    </main>
  );
}
