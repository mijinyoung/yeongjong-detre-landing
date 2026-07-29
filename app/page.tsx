import type { Metadata } from "next";
import Hero from "@/components/Hero";
import QuickLead from "@/components/QuickLead";
import VideoShowcase from "@/components/VideoShowcase";
import VisualHighlights from "@/components/VisualHighlights";
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
import { projectConfig } from "@/data/project-config";

export const metadata: Metadata = {
  title: projectConfig.seo.title,
  description: projectConfig.seo.description,
  keywords: projectConfig.seo.keywords,
  alternates: { canonical: "/" },
  category: "real estate",
  openGraph: {
    type: "website",
    locale: projectConfig.seo.locale,
    url: "/",
    title: projectConfig.identity.name,
    description: projectConfig.seo.shareDescription,
    siteName: projectConfig.identity.name,
    images: [{ url: projectConfig.seo.ogImage, width: 1200, height: 630, alt: projectConfig.seo.ogImageAlt }],
  },
  twitter: {
    card: "summary_large_image",
    title: projectConfig.identity.name,
    description: projectConfig.seo.shareDescription,
    images: [projectConfig.seo.ogImage],
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
      {projectConfig.display.quickLead ? <QuickLead /> : null}
      {projectConfig.display.videos ? <VideoShowcase /> : null}
      {projectConfig.display.visualHighlights ? <VisualHighlights /> : null}
      {projectConfig.display.whyNow ? <WhyNow /> : null}
      {projectConfig.display.location ? <InteractiveLocation /> : null}
      {projectConfig.display.businessOverview ? <BusinessOverview /> : null}
      {projectConfig.display.officialMaterials ? <OfficialMaterials /> : null}
      {projectConfig.display.premium ? <Premium /> : null}
      {projectConfig.display.timeline ? <DevelopmentTimeline /> : null}
      {projectConfig.display.community ? <CommunityHighlights /> : null}
      {projectConfig.display.salesGuide ? <ConsultationGuide /> : null}
      {projectConfig.display.floorPlans ? <FloorPlans /> : null}
      {projectConfig.display.landmark ? <Landmark /> : null}
      {projectConfig.display.visitProcess ? <VisitProcess /> : null}
      {projectConfig.display.faq ? <Faq /> : null}
      {projectConfig.display.finalCta ? <FinalCta /> : null}
      {projectConfig.display.leadSection ? <LeadSection /> : null}
      <Footer />
      <FloatingActions />
      <LeadModal />
      <PrivacyPolicy />
      <AnalyticsConsentManager />
    </main>
  );
}
