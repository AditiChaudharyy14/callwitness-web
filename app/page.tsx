import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import ClaimVsRecord from "@/components/ClaimVsRecord";
import Mechanism from "@/components/Mechanism";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ClaimVsRecord />
        <Mechanism />
      </main>
    </>
  );
}
