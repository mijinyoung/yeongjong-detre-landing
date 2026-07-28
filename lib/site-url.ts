const FALLBACK_SITE_URL = "https://yeongjong-detre-landing.vercel.app";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!configured) return FALLBACK_SITE_URL;

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return FALLBACK_SITE_URL;
    }
    return url.origin;
  } catch {
    console.warn("NEXT_PUBLIC_SITE_URL is invalid; using the fallback URL.");
    return FALLBACK_SITE_URL;
  }
}
