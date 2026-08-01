import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const root = join(dirname(fileURLToPath(import.meta.url)), "..");
export const registryPath = join(root, "data", "projects", "registry.json");

export function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

export function readRegistry() {
  if (!existsSync(registryPath)) {
    throw new Error(`현장 등록 파일이 없습니다: ${registryPath}`);
  }

  const registry = readJson(registryPath);
  if (!Array.isArray(registry.projects) || !registry.defaultProjectCode) {
    throw new Error("data/projects/registry.json 형식이 올바르지 않습니다.");
  }
  return registry;
}

export function resolveRootPath(relativePath) {
  const absolutePath = resolve(root, relativePath);
  const normalizedRoot = resolve(root);
  const relative = absolutePath.slice(normalizedRoot.length);

  if (absolutePath !== normalizedRoot && !relative.startsWith("\\") && !relative.startsWith("/")) {
    throw new Error(`프로젝트 밖의 경로는 사용할 수 없습니다: ${relativePath}`);
  }
  return absolutePath;
}

export function selectedProjectCode(registry) {
  return process.env.NEXT_PUBLIC_PROJECT_CODE?.trim() || registry.defaultProjectCode;
}

export function assertProjectCode(code) {
  if (!/^[a-z0-9][a-z0-9-]{2,49}$/.test(code || "")) {
    throw new Error("현장 코드는 영문 소문자·숫자·하이픈으로 3~50자여야 합니다.");
  }
}
