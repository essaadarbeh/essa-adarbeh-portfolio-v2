import type { Metadata, Viewport } from "next";
import { Anybody, Onest } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
import { paletteCss, palettes, PALETTE_STORAGE_KEY } from "@/lib/palettes";
import SmoothScroll from "@/components/SmoothScroll";
import Cursor from "@/components/Cursor";
import Nav from "@/components/Nav";

const anybody = Anybody({
  subsets: ["latin"],
  variable: "--font-anybody",
  axes: ["wdth"],
  display: "swap",
});

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  display: "swap",
});

const description =
  "Frontend developer and UI/UX designer in Amman, Jordan. Interfaces designed and built end to end, by one person.";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://essa-adarbeh.vercel.app"),
  title: `${site.name} — ${site.role}`,
  description,
  openGraph: { title: site.name, description, type: "website" },
  twitter: { card: "summary_large_image", title: site.name, description },
};

export const viewport: Viewport = {
  themeColor: palettes[0].field,
};

// Runs before paint: restores the visitor's palette (so there is no flash of
// the default), marks JS as on (so intro-hidden pieces start hidden), skips
// the intro for reduced motion, and forces it done after 4s in case fonts or
// scripts never arrive.
const fields = Object.fromEntries(palettes.map((p) => [p.id, p.field]));
const bootScript = `(function(){var d=document.documentElement;try{var p=localStorage.getItem('${PALETTE_STORAGE_KEY}');var f=${JSON.stringify(fields)};if(p&&f[p]){d.dataset.palette=p;var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',f[p])}}catch(e){}d.classList.add('js');if(matchMedia('(prefers-reduced-motion: reduce)').matches)d.dataset.intro='done';setTimeout(function(){if(d.dataset.intro!=='done'){d.dataset.intro='done';dispatchEvent(new Event('intro:done'))}},4000)})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anybody.variable} ${onest.variable}`} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: paletteCss() }} />
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a
          href="#about"
          className="sr-only z-[200] rounded-full bg-signal px-5 py-3 font-medium text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <SmoothScroll>
          <Nav />
          {children}
        </SmoothScroll>
        <Cursor />
      </body>
    </html>
  );
}
