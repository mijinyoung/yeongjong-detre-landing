"use client";

import { projectConfig } from "@/data/project-config";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Link from "next/link";
import CampaignLinkBuilder from "@/components/CampaignLinkBuilder";
import CampaignPerformanceReport from "@/components/CampaignPerformanceReport";

type Lead = {
  leadId: string;
  submittedAt: string;
  name: string;
  phone: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  placement: string;
  status: string;
  smsStatus: string;
  conversionStatus: string;
  memo: string;
};

type DashboardResponse = {
  ok?: boolean;
  message?: string;
  requestId?: string;
  leads?: Lead[];
  total?: number;
  updatedAt?: string;
  authenticated?: boolean;
  csrfToken?: string;
};

const STATUS_OPTIONS = ["신규", "연락완료", "상담중", "방문예약", "계약", "보류"];
const ADMIN_IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ADMIN_HEARTBEAT_INTERVAL_MS = 5 * 60 * 1000;
type AdminAuthState = "checking" | "signedOut" | "signingIn" | "signedIn";

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

function isOverdueLead(lead: Lead, referenceTime: number) {
  if (lead.status && lead.status !== "신규") return false;
  const submitted = new Date(lead.submittedAt).getTime();
  return Number.isFinite(submitted) && referenceTime - submitted >= 24 * 60 * 60 * 1000;
}

export default function AdminDashboardClient({ siteUrl }: { siteUrl: string }) {
  const [password, setPassword] = useState("");
  const [authState, setAuthState] = useState<AdminAuthState>("checking");
  const [csrfToken, setCsrfToken] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [drafts, setDrafts] = useState<Record<string, { status: string; memo: string }>>({});
  const [savingId, setSavingId] = useState("");
  const [savedId, setSavedId] = useState("");
  const [referenceTime, setReferenceTime] = useState(0);
  const [revealedPhones, setRevealedPhones] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState("");
  const sessionGenerationRef = useRef(0);
  const activeRequestsRef = useRef<Set<AbortController>>(new Set());
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const csrfTokenRef = useRef("");

  const lockDashboard = useCallback((reason: string, deleteServerSession = true) => {
    const csrf = csrfTokenRef.current;
    sessionGenerationRef.current += 1;
    const generation = sessionGenerationRef.current;
    activeRequestsRef.current.forEach((controller) => controller.abort());
    activeRequestsRef.current.clear();
    setPassword("");
    csrfTokenRef.current = "";
    setCsrfToken("");
    setAuthState("signedOut");
    setLeads([]);
    setTotal(0);
    setUpdatedAt("");
    setLoading(false);
    setDataLoaded(false);
    setMessage(reason);
    setSaveMessage("");
    setSaveStatus("idle");
    setQuery("");
    setStatusFilter("all");
    setSourceFilter("all");
    setDrafts({});
    setSavingId("");
    setSavedId("");
    setReferenceTime(0);
    setRevealedPhones({});
    setRevealingId("");
    window.setTimeout(() => tokenInputRef.current?.focus(), 0);

    if (deleteServerSession) {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 5000);
      void fetch("/api/admin/session", {
        method: "DELETE",
        headers: csrf ? { "x-admin-csrf": csrf } : undefined,
        credentials: "same-origin",
        cache: "no-store",
        signal: controller.signal,
      }).then((response) => {
        if (!response.ok && generation === sessionGenerationRef.current) {
          setMessage(
            "화면은 잠겼지만 서버 로그아웃을 확인하지 못했습니다. 안전을 위해 브라우저 창을 닫아 주세요.",
          );
        }
      }).catch(() => {
        if (generation === sessionGenerationRef.current) {
          setMessage(
            "화면은 잠겼지만 서버 로그아웃을 확인하지 못했습니다. 안전을 위해 브라우저 창을 닫아 주세요.",
          );
        }
      }).finally(() => window.clearTimeout(timer));
    }
  }, []);

  useEffect(() => {
    if (authState !== "signedIn" || !csrfToken) return;

    let timer = 0;
    let heartbeatTimer = 0;
    let heartbeatPending = false;
    let lastHeartbeatAt = Date.now();
    const lockForIdle = () =>
      lockDashboard("15분 동안 사용하지 않아 관리자 화면을 자동으로 잠갔습니다.");
    const refreshServerSession = async () => {
      if (heartbeatPending) return;
      heartbeatPending = true;
      const controller = new AbortController();
      heartbeatTimer = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch("/api/admin/session", {
          method: "PATCH",
          headers: { "x-admin-csrf": csrfToken },
          credentials: "same-origin",
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) {
          lockDashboard("관리자 로그인이 만료되었습니다. 다시 로그인해 주세요.");
        }
      } catch {
        lockDashboard(
          "관리자 세션을 안전하게 연장하지 못해 화면을 잠갔습니다. 다시 로그인해 주세요.",
        );
      } finally {
        window.clearTimeout(heartbeatTimer);
        heartbeatPending = false;
      }
    };
    const resetTimer = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(lockForIdle, ADMIN_IDLE_TIMEOUT_MS);
      const now = Date.now();
      if (now - lastHeartbeatAt >= ADMIN_HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatAt = now;
        void refreshServerSession();
      }
    };
    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    resetTimer();
    events.forEach((eventName) =>
      window.addEventListener(eventName, resetTimer, { passive: true }),
    );
    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(heartbeatTimer);
      events.forEach((eventName) =>
        window.removeEventListener(eventName, resetTimer),
      );
    };
  }, [authState, csrfToken, lockDashboard]);

  const sourceOptions = useMemo(() => {
    const values = new Map<string, string>();
    for (const lead of leads) {
      const source = lead.source?.trim() || "direct";
      const medium = lead.medium?.trim() || "";
      const key = `${source}|||${medium}`;
      values.set(
        key,
        [source === "direct" ? "직접 방문" : source, medium]
          .filter(Boolean)
          .join(" / "),
      );
    }
    return [...values.entries()].sort((a, b) =>
      a[1].localeCompare(b[1], "ko"),
    );
  }, [leads]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesKeyword =
        !keyword ||
        [lead.leadId, lead.name, lead.phone, lead.source, lead.medium, lead.campaign, lead.content, lead.term, lead.placement, lead.status, lead.smsStatus, lead.conversionStatus, lead.memo]
        .join(" ")
        .toLowerCase()
        .includes(keyword);
      const matchesSource =
        sourceFilter === "all" ||
        sourceFilter ===
          `${lead.source?.trim() || "direct"}|||${lead.medium?.trim() || ""}`;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "new" && (!lead.status || lead.status === "신규")) ||
        (statusFilter === "overdue" && isOverdueLead(lead, referenceTime)) ||
        (statusFilter === "sms-attention" && ["대기", "처리중", "실패"].includes(lead.smsStatus)) ||
        (statusFilter === "conversion-attention" && ["대기", "처리중", "실패"].includes(lead.conversionStatus)) ||
        (statusFilter.startsWith("status:") && lead.status === statusFilter.slice(7));
      return matchesKeyword && matchesSource && matchesStatus;
    });
  }, [leads, query, sourceFilter, statusFilter, referenceTime]);

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
  const smsAttentionCount = useMemo(
    () => leads.filter((lead) => ["대기", "처리중", "실패"].includes(lead.smsStatus)).length,
    [leads],
  );
  const conversionAttentionCount = useMemo(
    () => leads.filter((lead) => ["대기", "처리중", "실패"].includes(lead.conversionStatus)).length,
    [leads],
  );
  const overdueCount = useMemo(
    () => leads.filter((lead) => isOverdueLead(lead, referenceTime)).length,
    [leads, referenceTime],
  );
  const sevenDayTrend = useMemo(() => {
    if (!referenceTime) return [];
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(referenceTime);
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (6 - index));
      return {
        key: date.toLocaleDateString("ko-KR"),
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        count: 0,
      };
    });
    const indexByKey = new Map(days.map((day, index) => [day.key, index]));
    for (const lead of leads) {
      const date = new Date(lead.submittedAt);
      if (Number.isNaN(date.getTime())) continue;
      const index = indexByKey.get(date.toLocaleDateString("ko-KR"));
      if (index !== undefined) days[index].count += 1;
    }
    return days;
  }, [leads, referenceTime]);
  const maxDailyCount = Math.max(1, ...sevenDayTrend.map((day) => day.count));
  const sourceStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) {
      const source = [
        (lead.source || "직접 방문").trim(),
        lead.medium?.trim(),
      ].filter(Boolean).join(" / ");
      counts.set(source, (counts.get(source) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([source, count]) => ({
        source,
        count,
        rate: leads.length ? Math.round((count / leads.length) * 100) : 0,
      }));
  }, [leads]);
  const campaignStats = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) {
      const campaign = lead.campaign?.trim();
      const content = lead.content?.trim();
      if (!campaign && !content) continue;
      const label = [campaign || "캠페인 미지정", content].filter(Boolean).join(" / ");
      counts.set(label, (counts.get(label) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));
  }, [leads]);

  const loadLeads = useCallback(async (csrf = csrfTokenRef.current) => {
    if (!csrf) {
      lockDashboard("관리자 로그인이 필요합니다.", false);
      return;
    }
    setLoading(true);
    setMessage("");
    const generation = sessionGenerationRef.current;
    const controller = new AbortController();
    activeRequestsRef.current.add(controller);
    const timer = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("/api/admin/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-csrf": csrf,
        },
        body: "{}",
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      const raw = await response.text();
      if (response.status === 401 || response.status === 403) {
        lockDashboard("관리자 로그인이 만료되었습니다. 다시 로그인해 주세요.");
        return;
      }
      let result: DashboardResponse = {};
      try {
        result = raw ? (JSON.parse(raw) as DashboardResponse) : {};
      } catch {
        throw new Error("관리자 서버 응답을 확인할 수 없습니다.");
      }
      if (!response.ok || !result.ok) throw new Error(result.message || "불러오기에 실패했습니다.");
      if (generation !== sessionGenerationRef.current || controller.signal.aborted) return;

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
      setReferenceTime(Date.now());
      setRevealedPhones({});
      setDataLoaded(true);
    } catch (error) {
      if (generation !== sessionGenerationRef.current) return;
      const fallback =
        error instanceof DOMException && error.name === "AbortError"
          ? "접수 현황 요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요."
          : error instanceof Error
            ? error.message
            : "불러오기에 실패했습니다.";
      setMessage(fallback);
    } finally {
      window.clearTimeout(timer);
      activeRequestsRef.current.delete(controller);
      if (generation === sessionGenerationRef.current) setLoading(false);
    }
  }, [lockDashboard]);

  useEffect(() => {
    const controller = new AbortController();
    const generation = sessionGenerationRef.current;

    void fetch("/api/admin/session", {
      method: "GET",
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    }).then(async (response) => {
      const raw = await response.text();
      const result = raw ? (JSON.parse(raw) as DashboardResponse) : {};
      if (controller.signal.aborted || generation !== sessionGenerationRef.current) return;

      if (!response.ok || !result.ok || !result.csrfToken) {
        setAuthState("signedOut");
        if (response.status !== 401) {
          setMessage(result.message || "관리자 세션을 확인하지 못했습니다.");
        }
        window.setTimeout(() => tokenInputRef.current?.focus(), 0);
        return;
      }

      csrfTokenRef.current = result.csrfToken;
      setCsrfToken(result.csrfToken);
      setAuthState("signedIn");
      void loadLeads(result.csrfToken);
    }).catch((error) => {
      if (
        controller.signal.aborted ||
        generation !== sessionGenerationRef.current
      ) return;
      setAuthState("signedOut");
      setMessage(
        error instanceof SyntaxError
          ? "관리자 서버 응답을 확인할 수 없습니다."
          : "관리자 세션을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
      window.setTimeout(() => tokenInputRef.current?.focus(), 0);
    });

    return () => controller.abort();
  }, [loadLeads]);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = password.trim();
    if (!token) {
      setMessage("관리자 비밀번호를 입력해 주세요.");
      tokenInputRef.current?.focus();
      return;
    }

    setAuthState("signingIn");
    setMessage("");
    sessionGenerationRef.current += 1;
    const generation = sessionGenerationRef.current;
    const controller = new AbortController();
    activeRequestsRef.current.add(controller);
    const timer = window.setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      const raw = await response.text();
      const result = raw ? (JSON.parse(raw) as DashboardResponse) : {};
      if (!response.ok || !result.ok || !result.csrfToken) {
        throw new Error(result.message || "관리자 로그인에 실패했습니다.");
      }
      if (generation !== sessionGenerationRef.current || controller.signal.aborted) return;

      setPassword("");
      csrfTokenRef.current = result.csrfToken;
      setCsrfToken(result.csrfToken);
      setAuthState("signedIn");
      setDataLoaded(false);
      await loadLeads(result.csrfToken);
    } catch (error) {
      if (generation !== sessionGenerationRef.current) return;
      setAuthState("signedOut");
      const fallback =
        error instanceof DOMException && error.name === "AbortError"
          ? "관리자 로그인 요청 시간이 초과되었습니다. 다시 시도해 주세요."
          : error instanceof SyntaxError
            ? "관리자 서버 응답을 확인할 수 없습니다."
            : error instanceof Error
              ? error.message
              : "관리자 로그인에 실패했습니다.";
      setMessage(fallback);
      window.setTimeout(() => {
        tokenInputRef.current?.focus();
        tokenInputRef.current?.select();
      }, 0);
    } finally {
      window.clearTimeout(timer);
      activeRequestsRef.current.delete(controller);
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
    setSaveStatus("idle");
  }

  async function togglePhone(lead: Lead) {
    if (revealedPhones[lead.leadId]) {
      setRevealedPhones((current) => {
        const next = { ...current };
        delete next[lead.leadId];
        return next;
      });
      return;
    }

    const generation = sessionGenerationRef.current;
    const controller = new AbortController();
    activeRequestsRef.current.add(controller);
    setRevealingId(lead.leadId);
    setSaveMessage("");
    setSaveStatus("idle");

    try {
      const response = await fetch("/api/admin/leads/reveal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-csrf": csrfTokenRef.current,
        },
        body: JSON.stringify({
          leadId: lead.leadId,
        }),
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        lockDashboard("관리자 로그인이 만료되었습니다. 다시 로그인해 주세요.");
        return;
      }
      const result = (await response.json()) as DashboardResponse & { phone?: string };
      if (!response.ok || !result.ok || !result.phone) {
        throw new Error(result.message || "전화번호를 확인하지 못했습니다.");
      }
      if (generation !== sessionGenerationRef.current || controller.signal.aborted) return;

      setRevealedPhones((current) => ({
        ...current,
        [lead.leadId]: result.phone || "",
      }));
    } catch (error) {
      if (generation !== sessionGenerationRef.current) return;
      setSaveMessage(
        error instanceof Error ? error.message : "전화번호를 확인하지 못했습니다.",
      );
      setSaveStatus("error");
    } finally {
      activeRequestsRef.current.delete(controller);
      if (generation === sessionGenerationRef.current) setRevealingId("");
    }
  }

  async function saveLead(lead: Lead) {
    const draft = drafts[lead.leadId] || {
      status: lead.status || "신규",
      memo: lead.memo || "",
    };

    setSavingId(lead.leadId);
    setSavedId("");
    setSaveMessage("");
    setSaveStatus("idle");
    const generation = sessionGenerationRef.current;
    const controller = new AbortController();
    activeRequestsRef.current.add(controller);

    try {
      const response = await fetch("/api/admin/leads/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-csrf": csrfTokenRef.current,
        },
        body: JSON.stringify({
          leadId: lead.leadId,
          status: draft.status,
          memo: draft.memo,
        }),
        cache: "no-store",
        credentials: "same-origin",
        signal: controller.signal,
      });
      if (response.status === 401 || response.status === 403) {
        lockDashboard("관리자 로그인이 만료되었습니다. 다시 로그인해 주세요.");
        return;
      }
      const result = (await response.json()) as DashboardResponse;
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "상담 정보를 저장하지 못했습니다.");
      }
      if (generation !== sessionGenerationRef.current || controller.signal.aborted) return;

      setLeads((current) =>
        current.map((item) =>
          item.leadId === lead.leadId
            ? { ...item, status: draft.status, memo: draft.memo.trim() }
            : item,
        ),
      );
      setSavedId(lead.leadId);
      setSaveMessage(`${lead.name || "고객"}님의 상담 정보를 저장했습니다.`);
      setSaveStatus("success");
    } catch (error) {
      if (generation !== sessionGenerationRef.current) return;
      setSaveMessage(
        error instanceof Error ? error.message : "상담 정보를 저장하지 못했습니다.",
      );
      setSaveStatus("error");
    } finally {
      activeRequestsRef.current.delete(controller);
      if (generation === sessionGenerationRef.current) setSavingId("");
    }
  }

  function downloadCsv() {
    const headers = ["접수번호", "등록일시", "이름", "휴대폰", "유입경로", "매체유형", "캠페인", "광고소재", "검색어", "신청위치", "처리상태", "상담메모", "문자상태", "광고전환상태"];
    const rows = filtered.map((lead) => [
      lead.leadId, lead.submittedAt, lead.name, lead.phone, lead.source,
      lead.medium, lead.campaign, lead.content, lead.term, lead.placement, lead.status, lead.memo, lead.smsStatus, lead.conversionStatus,
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
            <p>{projectConfig.identity.adminName} · ADMIN</p>
            <h1>관심고객 접수 현황</h1>
            <span>최근 200건을 Google Sheets에서 안전하게 불러옵니다.</span>
          </div>
          <div className="adminHeaderActions">
            <Link href="/">홈페이지 보기</Link>
            {authState === "signedIn" ? (
              <button type="button" onClick={() => lockDashboard("관리자 화면을 안전하게 잠갔습니다.")}>
                로그아웃·잠금
              </button>
            ) : null}
          </div>
        </header>

        {authState === "checking" ? (
          <section className="adminLogin adminSessionStatus" aria-live="polite" aria-busy="true">
            <strong>관리자 세션 확인 중…</strong>
            <span>안전한 로그인 상태를 확인하고 있습니다.</span>
          </section>
        ) : authState === "signedOut" || authState === "signingIn" ? (
          <form className="adminLogin" onSubmit={(event) => void login(event)} aria-busy={authState === "signingIn"}>
            <label>
              <span>관리자 비밀번호</span>
              <input
                ref={tokenInputRef}
                aria-describedby="admin-token-help"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="ADMIN_DASHBOARD_TOKEN"
                disabled={authState === "signingIn"}
              />
            </label>
            <small id="admin-token-help">비밀번호는 로그인할 때 한 번만 확인하며 브라우저에 저장하지 않습니다.</small>
            <button type="submit" disabled={authState === "signingIn"}>
              {authState === "signingIn" ? "안전하게 로그인 중…" : "접수 현황 열기"}
            </button>
          </form>
        ) : (
          <section className="adminLogin adminSessionStatus" aria-live="polite" aria-busy={loading}>
            <div>
              <strong>보호된 관리자 세션</strong>
              <span>15분 동안 사용하지 않으면 고객정보가 자동으로 잠깁니다.</span>
            </div>
            <button type="button" onClick={() => void loadLeads()} disabled={loading}>
              {loading ? "새로고침 중…" : "접수 목록 새로고침"}
            </button>
          </section>
        )}

        {message ? <p className="adminMessage" role="alert">{message}</p> : null}
        <p className={`adminSaveNotice ${saveStatus}`} role={saveStatus === "error" ? "alert" : undefined} aria-live={saveStatus === "error" ? undefined : "polite"}>{saveMessage}</p>

        {authState === "signedIn" ? <CampaignLinkBuilder siteUrl={siteUrl} /> : null}

        {dataLoaded ? (
          <>
            <section className="adminStats">
              <article><span>전체 누적</span><strong>{total.toLocaleString("ko-KR")}</strong></article>
              <article><span>오늘 접수</span><strong>{todayCount.toLocaleString("ko-KR")}</strong></article>
              <article><span>신규 상담</span><strong>{pendingCount.toLocaleString("ko-KR")}</strong></article>
              <article className={smsAttentionCount ? "attention" : ""}><span>문자 확인 필요</span><strong>{smsAttentionCount.toLocaleString("ko-KR")}</strong></article>
              <article className={conversionAttentionCount ? "attention" : ""}><span>광고전환 확인</span><strong>{conversionAttentionCount.toLocaleString("ko-KR")}</strong></article>
              <article><span>최근 갱신</span><strong>{formatDate(updatedAt)}</strong></article>
            </section>

            <section className="adminPrivacyNotice" aria-label="개인정보 보호 안내">
              <strong>개인정보 보호 모드</strong>
              <span>목록과 CSV에는 가려진 전화번호만 제공됩니다. 상담할 고객의 번호만 서버에서 개별적으로 확인해 주세요.</span>
            </section>

            {overdueCount ? (
              <section className="adminOverdue" aria-label="미처리 상담 알림">
                <div>
                  <strong>24시간 이상 미처리된 신규 상담이 {overdueCount.toLocaleString("ko-KR")}건 있습니다.</strong>
                  <span>고객 연락 여부를 확인하고 처리 상태를 변경해 주세요.</span>
                </div>
                <button type="button" onClick={() => setStatusFilter("overdue")}>미처리 고객 보기</button>
              </section>
            ) : null}

            <section className="adminReports" aria-label="접수 운영 리포트">
              <article className="adminTrend">
                <div className="adminReportHeading">
                  <div><span>7 DAY TREND</span><h2>최근 7일 접수 추이</h2></div>
                  <strong>{sevenDayTrend.reduce((sum, day) => sum + day.count, 0).toLocaleString("ko-KR")}건</strong>
                </div>
                <div className="adminBars">
                  {sevenDayTrend.map((day) => (
                    <div key={day.key} aria-label={`${day.label} 접수 ${day.count}건`}>
                      <strong>{day.count}</strong>
                      <i style={{ height: `${Math.max(6, (day.count / maxDailyCount) * 100)}%` }} />
                      <span>{day.label}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="adminSources">
                <div className="adminReportHeading">
                  <div><span>LEAD SOURCE</span><h2>주요 유입경로</h2></div>
                </div>
                {sourceStats.length ? (
                  <ol>
                    {sourceStats.map((item) => (
                      <li key={item.source}>
                        <div><strong>{item.source}</strong><span>{item.count}건 · {item.rate}%</span></div>
                        <i><b style={{ width: `${item.rate}%` }} /></i>
                      </li>
                    ))}
                  </ol>
                ) : <p>아직 분석할 접수 데이터가 없습니다.</p>}
                <div className="adminCampaignSummary">
                  <h3>상위 캠페인·광고소재</h3>
                  {campaignStats.length ? (
                    <ol>
                      {campaignStats.map((item) => (
                        <li key={item.label}>
                          <div><strong>{item.label}</strong><span>{item.count}건</span></div>
                        </li>
                      ))}
                    </ol>
                  ) : <p>UTM 캠페인 데이터가 들어오면 여기에 표시됩니다.</p>}
                </div>
              </article>
            </section>

            <CampaignPerformanceReport leads={leads} referenceTime={referenceTime} />

            <section className="adminToolbar">
              <input aria-label="접수 목록 검색" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 전화번호, 캠페인·검색어 검색" />
              <select aria-label="광고 유입경로 필터" value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value)}>
                <option value="all">전체 유입경로</option>
                {sourceOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <select aria-label="접수 상태 필터" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">전체 상태</option>
                <option value="new">신규 상담</option>
                <option value="overdue">24시간 미처리</option>
                <option value="status:연락완료">연락완료</option>
                <option value="status:상담중">상담중</option>
                <option value="status:방문예약">방문예약</option>
                <option value="status:계약">계약</option>
                <option value="status:보류">보류</option>
                <option value="sms-attention">문자 확인 필요</option>
                <option value="conversion-attention">광고전환 확인 필요</option>
              </select>
              <span aria-live="polite">표시 {filtered.length.toLocaleString("ko-KR")}건</span>
              <button type="button" onClick={downloadCsv} disabled={!filtered.length}>CSV 내려받기</button>
            </section>

            <section className="adminTableWrap" role="region" aria-label="최근 관심고객 접수 목록" tabIndex={0} aria-busy={loading}>
              <table>
                <caption className="srOnly">최근 관심고객 접수 목록</caption>
                <thead><tr><th>등록일시</th><th>이름</th><th>휴대폰</th><th>유입경로</th><th>신청위치</th><th>상태</th><th>상담 메모</th><th>문자</th><th>광고전환</th><th>저장</th></tr></thead>
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
                      <td data-label="등록일시"><small>{lead.leadId}</small>{formatDate(lead.submittedAt)}</td>
                      <td data-label="이름"><strong>{lead.name || "-"}</strong></td>
                      <td data-label="휴대폰">
                        <div className="adminPhone">
                          {revealedPhones[lead.leadId] ? (
                            <a href={`tel:${revealedPhones[lead.leadId].replaceAll("-", "")}`}>{revealedPhones[lead.leadId]}</a>
                          ) : <span>{lead.phone || "-"}</span>}
                          {lead.phone ? (
                            <button
                              type="button"
                              aria-label={`${lead.name || "고객"} 전화번호 ${revealedPhones[lead.leadId] ? "숨기기" : "보기"}`}
                              disabled={revealingId === lead.leadId}
                              onClick={() => void togglePhone(lead)}
                            >
                              {revealingId === lead.leadId ? "확인 중" : revealedPhones[lead.leadId] ? "숨기기" : "번호 보기"}
                            </button>
                          ) : null}
                        </div>
                      </td>
                      <td data-label="유입경로">
                        <strong>{[lead.source || "직접 방문", lead.medium].filter(Boolean).join(" / ")}</strong>
                        {lead.campaign || lead.content || lead.term ? (
                          <small>
                            {[lead.campaign, lead.content, lead.term ? `검색어: ${lead.term}` : ""]
                              .filter(Boolean)
                              .join(" / ")}
                          </small>
                        ) : null}
                      </td>
                      <td data-label="신청위치">{lead.placement || "-"}</td>
                      <td data-label="상태">
                        <select
                          className="adminStatusSelect"
                          aria-label={`${lead.name || "고객"} 처리 상태`}
                          value={draft.status}
                          onChange={(event) => updateDraft(lead.leadId, { status: event.target.value })}
                        >
                          {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
                        </select>
                      </td>
                      <td data-label="상담 메모">
                        <textarea
                          className="adminMemo"
                          aria-label={`${lead.name || "고객"} 상담 메모`}
                          value={draft.memo}
                          maxLength={1000}
                          placeholder="상담 내용 입력"
                          onChange={(event) => updateDraft(lead.leadId, { memo: event.target.value })}
                        />
                      </td>
                      <td data-label="문자"><span className={`adminBadge ${
                        lead.smsStatus === "실패"
                          ? "failed"
                          : ["대기", "처리중"].includes(lead.smsStatus)
                            ? "processing"
                            : ""
                      }`}>{lead.smsStatus || "-"}</span></td>
                      <td data-label="광고전환">
                        <span className={`adminBadge ${
                          lead.conversionStatus === "실패"
                            ? "failed"
                            : ["대기", "처리중"].includes(lead.conversionStatus)
                              ? "processing"
                              : ""
                        }`}>{lead.conversionStatus || "-"}</span>
                      </td>
                      <td data-label="저장">
                        <button
                          className="adminSaveButton"
                          type="button"
                          disabled={!changed || Boolean(savingId)}
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
