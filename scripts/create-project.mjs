import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import {
  assertProjectCode,
  readJson,
  readRegistry,
  registryPath,
  resolveRootPath,
  root,
} from "./project-registry-utils.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const match = arg.match(/^--([^=]+)=(.*)$/);
    return match ? [match[1], match[2]] : [arg.replace(/^--/, ""), true];
  }),
);

const code = String(args.code || "").trim();
const name = String(args.name || "").trim();
const sourceCode = String(args.source || "yeongjong-detre").trim();
const dryRun = args["dry-run"] === true || args["dry-run"] === "true";

if (!code || !name) {
  throw new Error("사용법: npm run project:new -- --code=현장코드 --name=현장명 [--dry-run]");
}
assertProjectCode(code);

const registry = readRegistry();
if (registry.projects.some((project) => project.code === code)) {
  throw new Error(`이미 등록된 현장 코드입니다: ${code}`);
}

const source = registry.projects.find((project) => project.code === sourceCode);
if (!source) throw new Error(`복제 원본 현장을 찾을 수 없습니다: ${sourceCode}`);

const sourceConfig = readJson(resolveRootPath(source.configPath));
const configPath = join(root, "data", "projects", `${code}.json`);
const appsScriptPath = join(root, "integrations", "projects", code, "google-apps-script.gs");
const trackingEnvPath = join(root, "integrations", "projects", code, "vercel-environment.example");
const setupGuidePath = join(root, "integrations", "projects", code, "CAMPAIGN-SETUP.md");
const assetRoot = join(root, "public", "projects", code);

for (const path of [configPath, appsScriptPath, trackingEnvPath, setupGuidePath, assetRoot]) {
  if (existsSync(path)) throw new Error(`덮어쓰기를 막았습니다. 이미 존재합니다: ${path}`);
}

function replaceProjectName(value) {
  if (Array.isArray(value)) return value.map(replaceProjectName);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, replaceProjectName(child)]));
  }
  if (typeof value !== "string") return value;
  return value
    .replaceAll(sourceConfig.identity.name, name)
    .replaceAll(sourceConfig.identity.shortName, name)
    .replace(/^\/images\//, `/projects/${code}/images/`)
    .replace(/^\/videos\//, `/projects/${code}/videos/`);
}

const config = replaceProjectName(sourceConfig);
config.projectCode = code;
config.identity.name = name;
config.identity.shortName = name;
config.identity.adminName = code.replaceAll("-", " ").toUpperCase();
config.identity.englishName = code.replaceAll("-", " ").toUpperCase();
config.identity.regionName = name.split(/\s+/)[0] || name;
config.seo.fallbackSiteUrl = `https://${code}.example`;
config.conversion.leadIdPrefix = code
  .split("-")
  .map((part) => part[0] || "")
  .join("")
  .slice(0, 8)
  .padEnd(2, "X")
  .toUpperCase();

const nextRegistry = {
  ...registry,
  projects: [
    ...registry.projects,
    {
      code,
      name,
      status: "draft",
      configPath: `data/projects/${code}.json`,
      appsScriptPath: `integrations/projects/${code}/google-apps-script.gs`,
      assetBasePath: `/projects/${code}/`,
    },
  ],
};

if (dryRun) {
  console.log(`[미리보기] ${name} (${code}) 초안 생성 가능`);
  console.log(`- 설정: ${configPath}`);
  console.log(`- 자료: ${assetRoot}`);
  console.log(`- 시트 연동: ${appsScriptPath}`);
  console.log(`- 광고 환경변수: ${trackingEnvPath}`);
  console.log(`- 현장 준비 안내: ${setupGuidePath}`);
  process.exit(0);
}

mkdirSync(dirname(configPath), { recursive: true });
mkdirSync(dirname(appsScriptPath), { recursive: true });
mkdirSync(join(assetRoot, "images"), { recursive: true });
mkdirSync(join(assetRoot, "videos"), { recursive: true });

writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
writeFileSync(registryPath, `${JSON.stringify(nextRegistry, null, 2)}\n`, "utf8");

const sourceAppsScript = readFileSync(resolveRootPath(source.appsScriptPath), "utf8")
  .replace(/const PROJECT_CODE = '[^']+';/, `const PROJECT_CODE = '${code}';`);
writeFileSync(appsScriptPath, sourceAppsScript, "utf8");
writeFileSync(
  trackingEnvPath,
  `# ${name} Vercel 환경변수 체크리스트
NEXT_PUBLIC_PROJECT_CODE=${code}
NEXT_PUBLIC_SITE_URL=https://${code}.example
ADMIN_ALLOWED_ORIGINS=https://${code}.example

NEXT_PUBLIC_TRACKING_MODE=gtm
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_TRACKING_DEBUG=false
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GOOGLE_ADS_ID=
NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL=

NEXT_PUBLIC_META_PIXEL_ID=
META_PIXEL_ID=
META_CAPI_ACCESS_TOKEN=
META_GRAPH_API_VERSION=v24.0
META_TEST_EVENT_CODE=

NEXT_PUBLIC_KAKAO_PIXEL_ID=
NEXT_PUBLIC_KAKAO_LEAD_TAG=Consulting
NEXT_PUBLIC_NAVER_WCS_ACCOUNT_ID=
NEXT_PUBLIC_NAVER_WCS_DOMAIN=${code}.example
NEXT_PUBLIC_NAVER_WCS_LEAD_TYPE=lead

GOOGLE_SHEET_WEBHOOK_URL=
SOLAPI_API_KEY=
SOLAPI_API_SECRET=
SOLAPI_SENDER_NUMBER=
SMS_RECIPIENT_NUMBER=
SYSTEM_CHECK_TOKEN=
ADMIN_DASHBOARD_TOKEN=
ADMIN_SESSION_SECRET=
`,
  "utf8",
);
writeFileSync(
  setupGuidePath,
  `# ${name} 현장 준비 체크리스트

1. \`data/projects/${code}.json\`의 현장명, 전화번호, 사업정보와 문구를 교체합니다.
2. \`public/projects/${code}/images\`와 \`videos\`에 현장 자료를 넣습니다.
3. \`vercel-environment.example\`을 보며 현장 전용 Vercel 환경변수를 입력합니다.
4. Google Sheets용 Apps Script를 배포하고 웹 앱 주소를 연결합니다.
5. Meta·Google/GDN·카카오·네이버 광고 ID를 입력합니다.
6. GTM 모드라면 \`generate_lead\` 이벤트로 각 채널의 문의 완료 태그를 연결합니다.
7. 자료 확인 후 \`data/projects/registry.json\`의 status를 \`active\`로 바꿉니다.
8. \`NEXT_PUBLIC_PROJECT_CODE=${code} npm run verify\`로 최종 검증합니다.
9. 배포 후 \`/system-check\`에서 광고 송출 가능 판정을 확인합니다.
`,
  "utf8",
);
writeFileSync(
  join(assetRoot, "ASSETS.txt"),
  `${name} 전용 이미지와 영상을 images, videos 폴더에 넣으세요.\n초안 상태에서는 운영 배포가 차단됩니다.\n`,
  "utf8",
);

const sync = spawnSync(process.execPath, [join(root, "scripts", "generate-project-registry.mjs")], {
  cwd: root,
  stdio: "inherit",
});
if (sync.status !== 0) throw new Error("현장 등록부 동기화에 실패했습니다.");

console.log(`${name} 초안을 만들었습니다.`);
console.log("자료와 연동값을 채운 뒤 registry.json의 status를 active로 바꾸고 전체 검증을 실행하세요.");
