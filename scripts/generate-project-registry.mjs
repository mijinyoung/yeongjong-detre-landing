import { writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import {
  assertProjectCode,
  readRegistry,
  resolveRootPath,
  root,
} from "./project-registry-utils.mjs";

const registry = readRegistry();
const outputPath = join(root, "data", "projects", "generated-project-registry.ts");
const activeProjects = registry.projects.filter((project) => project.status === "active");

if (!activeProjects.length) throw new Error("활성 상태인 현장이 하나 이상 필요합니다.");
if (!activeProjects.some((project) => project.code === registry.defaultProjectCode)) {
  throw new Error("기본 현장은 active 상태여야 합니다.");
}

const seen = new Set();
const imports = [];
const entries = [];

activeProjects.forEach((project, index) => {
  assertProjectCode(project.code);
  if (seen.has(project.code)) throw new Error(`중복 현장 코드입니다: ${project.code}`);
  seen.add(project.code);

  const configPath = resolveRootPath(project.configPath);
  let importPath = relative(dirname(outputPath), configPath).replaceAll("\\", "/");
  if (!importPath.startsWith(".")) importPath = `./${importPath}`;

  imports.push(`import project${index} from ${JSON.stringify(importPath)};`);
  entries.push(`  ${JSON.stringify(project.code)}: project${index},`);
});

const output = `/* 자동 생성 파일입니다. scripts/generate-project-registry.mjs가 갱신합니다. */
import type { ProjectConfig } from "./project-schema";
${imports.join("\n")}

export const defaultProjectCode = ${JSON.stringify(registry.defaultProjectCode)};

export const registeredProjectConfigs: Readonly<Record<string, ProjectConfig>> = {
${entries.join("\n")}
};
`;

writeFileSync(outputPath, output, "utf8");
console.log(`활성 현장 ${activeProjects.length}개를 빌드 등록부에 반영했습니다.`);
