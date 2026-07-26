import Hero from "@/components/Hero";
import QuickLead from "@/components/QuickLead";
import Stats from "@/components/Stats";
import BusinessOverview from "@/components/BusinessOverview";
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
import UtmCapture from "@/components/UtmCapture";

export default function Home() {
  return (
    <main>
      <MetaPixel />
      <UtmCapture />
      <Hero />
      <QuickLead />
      <Stats />
      <BusinessOverview />
      <InteractiveLocation />
      <Premium />
      <DevelopmentTimeline />
      <CommunityHighlights />
      <ConsultationGuide />
      <FloorPlans />
      <Landmark />
      <Faq />
      <FinalCta />
      <LeadSection />
      <Footer />
      <FloatingActions />
      <LeadModal />
    </main>
  );
}
