import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import TryIt from "@/components/TryIt";
import ClaimVsRecord from "@/components/ClaimVsRecord";
import Mechanism from "@/components/Mechanism";
import Evidence from "@/components/Evidence";
import Measurements from "@/components/Measurements";
import Review from "@/components/Review";
import Limits from "@/components/Limits";
import Footer from "@/components/Footer";
import WitzyCompanion from "@/components/WitzyCompanion";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TryIt />
        <ClaimVsRecord />
        <Mechanism />
        <Evidence />
        <Measurements />
        <Review />
        <Limits />
      </main>
      <Footer />
      <WitzyCompanion />
    </>
  );
}
