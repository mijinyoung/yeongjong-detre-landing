const FALLBACK_SITE_URL = "https://yeongjong-detre-landing.vercel.app";

export function getSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const isProductionDeployment = process.env.VERCEL_ENV === "production";

  if (!configured) {
    if (isProductionDeployment) {
      throw new Error("NEXT_PUBLIC_SITE_URL must be set for the production deployment.");
    }
    return FALLBACK_SITE_URL;
  }

  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      throw new Error("NEXT_PUBLIC_SITE_URL must use http or https.");
    }
    if (isProductionDeployment && url.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_SITE_URL must use https in production.");
    }
    return url.origin;
  } catch (error) {
    if (isProductionDeployment) throw error;
    console.warn("NEXT_PUBLIC_SITE_URL is invalid; using the development fallback URL.");
    return FALLBACK_SITE_URL;
  }
}
