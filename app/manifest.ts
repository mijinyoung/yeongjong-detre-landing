import type { MetadataRoute } from "next";
import { projectConfig } from "@/data/project-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: projectConfig.identity.name,
    short_name: projectConfig.identity.shortName,
    description: projectConfig.seo.description,
    start_url: "/",
    display: "standalone",
    background_color: projectConfig.theme.browserTheme,
    theme_color: projectConfig.theme.browserTheme,
    lang: projectConfig.seo.language,
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
