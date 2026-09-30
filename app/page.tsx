import { Suspense } from "react";
import Hero from "@/components/sections/Hero";
import About from "@/components/sections/About";
import Work from "@/components/sections/Work";
import Process from "@/components/sections/Process";
import Toolkit from "@/components/sections/Toolkit";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/Footer";

// Each section is its own Suspense boundary, so React hydrates them as
// separate chunks and can yield to the browser in between, instead of one
// long task that blocks the first interactions on a phone.
export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Suspense>
          <About />
        </Suspense>
        <Suspense>
          <Work />
        </Suspense>
        <Suspense>
          <Process />
        </Suspense>
        <Suspense>
          <Toolkit />
        </Suspense>
        <Suspense>
          <Contact />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
