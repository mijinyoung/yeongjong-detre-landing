import type { Metadata } from "next";
import Hero from "@/components/Hero";
import QuickLead from "@/components/QuickLead";
import VideoShowcase from "@/components/VideoShowcase";
import WhyNow from "@/components/WhyNow";
import BusinessOverview from "@/components/BusinessOverview";
import OfficialMaterials from "@/components/OfficialMaterials";
import InteractiveLocation from "@/components/InteractiveLocation";
import Premium from "@/components/Premium";
import CommunityHighlights from "@/components/CommunityHighlights";
import ConsultationGuide from "@/components/ConsultationGuide";
import DevelopmentTimeline from "@/components/DevelopmentTimeline";
import FloorPlans from "@/components/FloorPlans";
import Landmark from "@/components/Landmark";
import Faq from "@/components/Faq";
import FinalCta from "@/components/FinalCta";
import LeadSection from "@/components/LeadSection";
import FloatingActions from "@/components/FloatingActions";
import Footer from "@/components/Footer";
import LeadModal from "@/components/LeadModal";
import MetaPixel from "@/components/MetaPixel";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import ConversionTracker from "@/components/ConversionTracker";
import UtmCapture from "@/components/UtmCapture";
import PrivacyPolicy from "@/components/PrivacyPolicy";
import StructuredData from "@/components/StructuredData";
import VisitProcess from "@/components/VisitProcess";
import AnalyticsConsentManager from "@/components/AnalyticsConsent";

export const metadata: Metadata = {
  title: "영종 디에트르 라 메르 | 관심고객 등록",
  description: "청라하늘대교 생활권, 최고 49층 영종 디에트르 라 메르 분양 안내 및 관심고객 등록",
  keywords: ["영종 디에트르", "영종 디에트르 라 메르", "청라하늘대교", "영종 분양", "관심고객 등록"],
  alternates: { canonical: "/" },
  category: "real estate",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    title: "영종 디에트르 라 메르",
    description: "청라하늘대교 생활권, 최고 49층 랜드마크 분양 안내",
    siteName: "영종 디에트르 라 메르",
    images: [{ url: "/images/hero-og.jpg", width: 1200, height: 630, alt: "영종 디에트르 라 메르 투시도" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "영종 디에트르 라 메르",
    description: "청라하늘대교 생활권, 최고 49층 랜드마크 분양 안내",
    images: ["/images/hero-og.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function Home() {
  return (
    <main id="main-content">
      <StructuredData />
      <MetaPixel />
      <GoogleAnalytics />
      <ConversionTracker />
      <UtmCapture />
      <Hero />
      <QuickLead />
      <VideoShowcase />
      <WhyNow />
      <InteractiveLocation />
      <BusinessOverview />
      <OfficialMaterials />
      <Premium />
      <DevelopmentTimeline />
      <CommunityHighlights />
      <ConsultationGuide />
      <FloorPlans />
      <Landmark />
      <VisitProcess />
      <Faq />
      <FinalCta />
      <LeadSection />
      <Footer />
      <FloatingActions />
      <LeadModal />
      <PrivacyPolicy />
      <AnalyticsConsentManager />
    </main>
  );
}
