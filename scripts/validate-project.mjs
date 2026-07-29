import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "data", "project-content.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const errors = [];
const warnings = [];

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
  ["conversion.smsTitle", config.conversion?.smsTitle]
];

for (const [label, value] of requiredStrings) {
  if (typeof value !== "string" || !value.trim()) {
    errors.push(`${label} 값이 비어 있습니다.`);
  }
}

if (!/^[a-z0-9][a-z0-9-]{2,49}$/.test(config.projectCode || "")) {
  errors.push("projectCode는 영문 소문자·숫자·하이픈으로 입력해 주세요.");
}

if (!/^\d{8,12}$/.test(config.contact?.phoneDigits || "")) {
  errors.push("contact.phoneDigits는 하이픈 없는 8~12자리 숫자여야 합니다.");
}

try {
  const fallbackUrl = new URL(config.seo?.fallbackSiteUrl || "");
  if (!["http:", "https:"].includes(fallbackUrl.protocol)) throw new Error();
} catch {
  errors.push("seo.fallbackSiteUrl은 http 또는 https로 시작하는 전체 주소여야 합니다.");
}

if (!/^[A-Z0-9]{2,8}$/.test(config.conversion?.leadIdPrefix || "")) {
  errors.push("conversion.leadIdPrefix는 2~8자리 영문 대문자·숫자여야 합니다.");
}

if (!Array.isArray(config.hero?.headlineLines) || config.hero.headlineLines.length < 1) {
  errors.push("hero.headlineLines를 1줄 이상 입력해 주세요.");
}

if (config.display?.floorPlans && (!Array.isArray(config.sections?.floorPlans?.items) || config.sections.floorPlans.items.length < 1)) {
  warnings.push("평면 정보가 없습니다. 평면 섹션을 사용하지 않을 경우 페이지 구성에서 제외해 주세요.");
}

for (const key of [
  "quickLead", "videos", "whyNow", "location", "businessOverview",
  "officialMaterials", "premium", "timeline", "community", "salesGuide",
  "floorPlans", "landmark", "visitProcess", "faq", "finalCta", "leadSection"
]) {
  if (typeof config.display?.[key] !== "boolean") {
    errors.push(`display.${key}는 true 또는 false여야 합니다.`);
  }
}

for (const item of config.navigation || []) {
  if (!item.label || !/^#[a-z0-9-]+$/.test(item.href || "")) {
    errors.push("navigation 항목의 label과 #으로 시작하는 href를 확인해 주세요.");
  }
  if (typeof item.enabled !== "boolean") {
    errors.push(`navigation.${item.label || "unknown"}.enabled는 true 또는 false여야 합니다.`);
  }
}

const seenIds = new Set();
for (const [groupName, items] of [
  ["입지", config.sections?.location?.places],
  ["공식자료", config.sections?.officialMaterials?.items],
  ["평면", config.sections?.floorPlans?.items],
  ["영상", config.sections?.videos?.items]
]) {
  for (const item of items || []) {
    const key = `${groupName}:${item.id}`;
    if (!item.id) errors.push(`${groupName} 항목에 id가 없습니다.`);
    if (seenIds.has(key)) errors.push(`${groupName} 항목 id가 중복됩니다: ${item.id}`);
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
      const clean = childValue.split("?")[0];
      if (!existsSync(join(root, "public", clean))) {
        errors.push(`${path} 파일이 없습니다: public${clean}`);
      }
    } else {
      collectAssets(childValue, path);
    }
  }
}

collectAssets(config);

for (const image of config.assets?.sitemapImages || []) {
  const clean = String(image).split("?")[0];
  if (!existsSync(join(root, "public", clean))) {
    errors.push(`sitemap 이미지 파일이 없습니다: public${clean}`);
  }
}

const serialized = JSON.stringify(config);
for (const placeholder of ["TODO", "여기에-입력", "000-0000-0000", "PROJECT_NAME"]) {
  if (serialized.includes(placeholder)) {
    errors.push(`교체되지 않은 임시값이 있습니다: ${placeholder}`);
  }
}

const appsScript = readFileSync(
  join(root, "integrations", "google-apps-script.gs"),
  "utf8"
);
if (!appsScript.includes(`const PROJECT_CODE = '${config.projectCode}';`)) {
  errors.push("Google Apps Script의 PROJECT_CODE가 현장 설정과 다릅니다.");
}
if (!appsScript.includes(`version: '${config.version}'`)) {
  errors.push("Google Apps Script의 version이 현장 설정과 다릅니다.");
}

for (const warning of warnings) console.warn(`주의: ${warning}`);

if (errors.length) {
  for (const error of errors) console.error(`오류: ${error}`);
  process.exitCode = 1;
} else {
  console.log(`현장 설정 정상: ${config.identity.name} (${config.version})`);
  console.log(`연결된 이미지·영상과 필수 항목을 확인했습니다.`);
}
