import GoogleAnalytics from "@/components/GoogleAnalytics";
import GoogleTagManager from "@/components/GoogleTagManager";
import KakaoPixel from "@/components/KakaoPixel";
import MetaPixel from "@/components/MetaPixel";
import NaverAdsTracking from "@/components/NaverAdsTracking";

export default function AdvertisingTracking() {
  const trackingMode =
    process.env.NEXT_PUBLIC_TRACKING_MODE?.trim().toLowerCase() === "gtm"
      ? "gtm"
      : "direct";

  if (trackingMode === "gtm") return <GoogleTagManager />;

  return (
    <>
      <MetaPixel />
      <GoogleAnalytics />
      <KakaoPixel />
      <NaverAdsTracking />
    </>
  );
}
