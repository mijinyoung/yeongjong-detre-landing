import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  assertProjectCode,
  readJson,
  readRegistry,
  resolveRootPath,
  root,
  selectedProjectCode,
} from "./project-registry-utils.mjs";

const registry = readRegistry();
const packageJson = readJson(join(root, "package.json"));
const selectedCode = selectedProjectCode(registry);
const errors = [];
const warnings = [];

function error(projectCode, message) {
  errors.push(`[${projectCode}] ${message}`);
}

function warning(projectCode, message) {
  warnings.push(`[${projectCode}] ${message}`);
}

if (registry.schemaVersion !== 1) {
  errors.push("현장 등록부 schemaVersion은 1이어야 합니다.");
}

const seenCodes = new Set();
for (const project of registry.projects) {
  try {
    assertProjectCode(project.code);
  } catch (cause) {
    errors.push(cause instanceof Error ? cause.message : String(cause));
  }

  if (seenCodes.has(project.code)) errors.push(`중복 현장 코드입니다: ${project.code}`);
  seenCodes.add(project.code);

  if (!['active', 'draft'].includes(project.status)) {
    error(project.code, "status는 active 또는 draft여야 합니다.");
  }
  if (!project.name?.trim()) error(project.code, "현장명이 비어 있습니다.");
  if (!project.configPath || !existsSync(resolveRootPath(project.configPath))) {
    error(project.code, `설정 파일이 없습니다: ${project.configPath || "미입력"}`);
  }
  if (!project.appsScriptPath || !existsSync(resolveRootPath(project.appsScriptPath))) {
    error(project.code, `Apps Script 파일이 없습니다: ${project.appsScriptPath || "미입력"}`);
  }
}

const selectedEntry = registry.projects.find((project) => project.code === selectedCode);
if (!selectedEntry) {
  errors.push(`선택한 현장이 등록되어 있지 않습니다: ${selectedCode}`);
} else if (selectedEntry.status !== "active") {
  errors.push(`선택한 현장은 아직 자료 준비 중이라 배포할 수 없습니다: ${selectedCode}`);
}

if (!seenCodes.has(registry.defaultProjectCode)) {
  errors.push(`기본 현장이 등록되어 있지 않습니다: ${registry.defaultProjectCode}`);
}

function validateActiveProject(entry) {
  const config = readJson(resolveRootPath(entry.configPath));
  const code = entry.code;
  const requiredStrings = [
    ["projectCode", config.projectCode],
    ["version", config.version],
    ["identity.name", config.identity?.name],
    ["identity.shortName", config.identity?.shortName],
    ["contact.displayPhone", config.contact?.displayPhone],
    ["contact.phoneDigits", config.contact?.phoneDigits],
    ["seo.title", config.seo?.title],
    ["seo.fallbackSiteUrl", config.seo?.fallbackSiteUrl],
    ["seo.description", config.seo?.description],
    ["seo.ogImage", config.seo?.ogImage],
    ["hero.eyebrow", config.hero?.eyebrow],
    ["conversion.leadIdPrefix", config.conversion?.leadIdPrefix],
    ["conversion.smsTitle", config.conversion?.smsTitle],
  ];

  for (const [label, value] of requiredStrings) {
    if (typeof value !== "string" || !value.trim()) error(code, `${label} 값이 비어 있습니다.`);
  }

  if (config.projectCode !== code) {
    error(code, `등록부 코드와 설정의 projectCode가 다릅니다: ${config.projectCode}`);
  }
  if (config.version !== packageJson.version) {
    error(code, `package version(${packageJson.version})과 project version(${config.version})이 다릅니다.`);
  }
  if (!/^\d{8,12}$/.test(config.contact?.phoneDigits || "")) {
    error(code, "contact.phoneDigits는 하이픈 없는 8~12자리 숫자여야 합니다.");
  }
  if (!/^[A-Z0-9]{2,8}$/.test(config.conversion?.leadIdPrefix || "")) {
    error(code, "conversion.leadIdPrefix는 2~8자리 영문 대문자·숫자여야 합니다.");
  }

  try {
    const fallbackUrl = new URL(config.seo?.fallbackSiteUrl || "");
    if (!["http:", "https:"].includes(fallbackUrl.protocol)) throw new Error();
  } catch {
    error(code, "seo.fallbackSiteUrl은 http 또는 https로 시작하는 전체 주소여야 합니다.");
  }

  if (!Array.isArray(config.hero?.headlineLines) || config.hero.headlineLines.length < 1) {
    error(code, "hero.headlineLines를 한 줄 이상 입력해 주세요.");
  }
  if (
    config.display?.floorPlans &&
    (!Array.isArray(config.sections?.floorPlans?.items) || config.sections.floorPlans.items.length < 1)
  ) {
    warning(code, "평면 섹션이 켜져 있지만 평면 정보가 없습니다.");
  }

  for (const key of [
    "quickLead", "videos", "visualHighlights", "whyNow", "location", "businessOverview",
    "officialMaterials", "premium", "timeline", "community", "salesGuide",
    "floorPlans", "landmark", "visitProcess", "faq", "finalCta", "leadSection",
  ]) {
    if (typeof config.display?.[key] !== "boolean") {
      error(code, `display.${key}는 true 또는 false여야 합니다.`);
    }
  }

  for (const item of config.navigation || []) {
    if (!item.label || !/^#[a-z0-9-]+$/.test(item.href || "")) {
      error(code, "navigation 항목의 label과 #으로 시작하는 href를 확인해 주세요.");
    }
    if (typeof item.enabled !== "boolean") {
      error(code, `navigation.${item.label || "unknown"}.enabled는 true 또는 false여야 합니다.`);
    }
  }

  const seenIds = new Set();
  for (const [groupName, items] of [
    ["입지", config.sections?.location?.places],
    ["공식자료", config.sections?.officialMaterials?.items],
    ["평면", config.sections?.floorPlans?.items],
    ["영상", config.sections?.videos?.items],
  ]) {
    for (const item of items || []) {
      const key = `${groupName}:${item.id}`;
      if (!item.id) error(code, `${groupName} 항목의 id가 없습니다.`);
      if (seenIds.has(key)) error(code, `${groupName} 항목 id가 중복됩니다: ${item.id}`);
      seenIds.add(key);
    }
  }

  function collectAssets(value, key = "") {
    if (Array.isArray(value)) {
      value.forEach((item, index) => collectAssets(item, `${key}[${index}]`));
      return;
    }
    if (!value || typeof value !== "object") return;

    for (const [childKey, childValue] of Object.entries(value)) {
      const path = key ? `${key}.${childKey}` : childKey;
      if (
        typeof childValue === "string" &&
        ["image", "poster", "src", "ogImage", "heroVideo", "heroPoster", "heroImage"].includes(childKey) &&
        childValue.startsWith("/")
      ) {
        const clean = childValue.split("?")[0].replace(/^\/+/, "");
        if (!existsSync(join(root, "public", clean))) {
          error(code, `${path} 파일이 없습니다: public/${clean}`);
        }
      } else {
        collectAssets(childValue, path);
      }
    }
  }

  collectAssets(config);
  for (const image of config.assets?.sitemapImages || []) {
    const clean = String(image).split("?")[0].replace(/^\/+/, "");
    if (!existsSync(join(root, "public", clean))) {
      error(code, `sitemap 이미지 파일이 없습니다: public/${clean}`);
    }
  }

  const serialized = JSON.stringify(config);
  for (const placeholder of ["TODO", "여기에-입력", "000-0000-0000", "PROJECT_NAME", ".example"]) {
    if (serialized.includes(placeholder)) {
      error(code, `교체하지 않은 임시값이 있습니다: ${placeholder}`);
    }
  }

  const appsScript = readFileSync(resolveRootPath(entry.appsScriptPath), "utf8");
  if (!appsScript.includes(`const PROJECT_CODE = '${config.projectCode}';`)) {
    error(code, "Google Apps Script의 PROJECT_CODE가 현장 설정과 다릅니다.");
  }
  if (!appsScript.includes(`version: '${config.version}'`)) {
    error(code, "Google Apps Script의 version이 현장 설정과 다릅니다.");
  }
  for (const marker of [
    "'광고전환상태'",
    "'광고전환처리시각'",
    "'광고전환상세'",
    "'claimDelivery'",
    "'claimConversion'",
    "'updateConversion'",
  ]) {
    if (!appsScript.includes(marker)) {
      error(code, `Google Apps Script의 운영 항목이 빠져 있습니다: ${marker}`);
    }
  }

  const sheetAuth = readFileSync(join(root, "lib", "sheet-auth.ts"), "utf8");
  const connectionVersion = "YD_SHEET_CAPABILITY_V1";
  if (
    !appsScript.includes(`const SHEET_CONNECTION_VERSION = '${connectionVersion}';`) ||
    !sheetAuth.includes(`const SHEET_CONNECTION_VERSION = "${connectionVersion}";`)
  ) {
    error(code, "Vercel과 Google Apps Script의 자동 연결 규칙이 다릅니다.");
  }
}

for (const project of registry.projects) {
  if (project.status === "active" && project.configPath && existsSync(resolveRootPath(project.configPath))) {
    validateActiveProject(project);
  }
}

for (const message of warnings) console.warn(`주의: ${message}`);

if (errors.length) {
  for (const message of errors) console.error(`오류: ${message}`);
  process.exitCode = 1;
} else {
  const activeCount = registry.projects.filter((project) => project.status === "active").length;
  const draftCount = registry.projects.filter((project) => project.status === "draft").length;
  console.log(`현장 설정 정상: ${selectedEntry.name} (${packageJson.version})`);
  console.log(`운영 가능 ${activeCount}개 · 자료 준비 중 ${draftCount}개 · 연결 자산과 필수 항목 확인 완료`);
}
