import content from "@/data/project-content.json";

export type ProjectConfig = typeof content;

export const projectConfig: ProjectConfig = content;

export const contactHref = `tel:${projectConfig.contact.phoneDigits}`;

export function renderTitleLines(lines: readonly string[]) {
  return lines.join(" ");
}

export function publicAssetPath(value: string) {
  return value.split("?")[0];
}
