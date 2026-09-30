import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Work from "@/components/sections/Work";
import Process from "@/components/sections/Process";
import Toolkit from "@/components/sections/Toolkit";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <About />
        <Work />
        <Process />
        <Toolkit />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
