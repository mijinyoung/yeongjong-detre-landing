import Hero from "@/components/Hero";
import QuickLead from "@/components/QuickLead";
import WhyNow from "@/components/WhyNow";
import Stats from "@/components/Stats";
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
