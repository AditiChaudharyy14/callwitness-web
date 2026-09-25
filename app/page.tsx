import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ClaimVsRecord from "@/components/ClaimVsRecord";
import Mechanism from "@/components/Mechanism";
import Evidence from "@/components/Evidence";
import Measurements from "@/components/Measurements";
import Review from "@/components/Review";
import Limits from "@/components/Limits";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ClaimVsRecord />
        <Mechanism />
        <Evidence />
        <Measurements />
        <Review />
        <Limits />
      </main>
      <Footer />
    </>
  );
}
