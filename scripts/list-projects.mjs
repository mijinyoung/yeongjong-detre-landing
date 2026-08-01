import { readRegistry, selectedProjectCode } from "./project-registry-utils.mjs";

const registry = readRegistry();
const selected = selectedProjectCode(registry);

console.log("등록된 광고 현장");
for (const project of registry.projects) {
  const current = project.code === selected ? " ← 현재 선택" : "";
  const status = project.status === "active" ? "운영 가능" : "자료 준비 중";
  console.log(`- ${project.name} [${project.code}] · ${status}${current}`);
}
