import {
  defaultProjectCode,
  registeredProjectConfigs,
} from "@/data/projects/generated-project-registry";
import type { ProjectConfig } from "@/data/projects/project-schema";

export type { ProjectConfig } from "@/data/projects/project-schema";

export const selectedProjectCode =
  process.env.NEXT_PUBLIC_PROJECT_CODE?.trim() || defaultProjectCode;

const selectedProject = registeredProjectConfigs[selectedProjectCode];

if (!selectedProject) {
  throw new Error(
    `등록되지 않았거나 아직 초안 상태인 현장입니다: ${selectedProjectCode}`,
  );
}

export const projectConfig: ProjectConfig = selectedProject;

export const contactHref = `tel:${projectConfig.contact.phoneDigits}`;

export function renderTitleLines(lines: readonly string[]) {
  return lines.join(" ");
}

export function publicAssetPath(value: string) {
  return value.split("?")[0];
}
