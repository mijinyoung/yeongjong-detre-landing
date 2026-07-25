import Hero from "@/components/Hero";
import QuickLead from "@/components/QuickLead";
import Stats from "@/components/Stats";
import Location from "@/components/Location";
import Premium from "@/components/Premium";
import Landmark from "@/components/Landmark";
import FloorPlans from "@/components/FloorPlans";
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
      <Location />
      <Premium />
      <FloorPlans />
      <Landmark />
      <LeadSection />
      <Footer />
      <FloatingActions />
      <LeadModal />
    </main>
  );
}
