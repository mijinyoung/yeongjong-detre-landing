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
const assetRoot = join(root, "public", "projects", code);

for (const path of [configPath, appsScriptPath, assetRoot]) {
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
