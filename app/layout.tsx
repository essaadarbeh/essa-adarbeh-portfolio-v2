import type { Metadata, Viewport } from "next";
import { Anybody, Onest } from "next/font/google";
import "./globals.css";
import { site } from "@/data/site";
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
  themeColor: "#2b3bff",
};

// Runs before paint: marks JS as on (so intro-hidden pieces start hidden
// instead of flashing), skips the intro entirely for reduced motion, and
// forces it done after 4s in case fonts or scripts never arrive.
const bootScript = `(function(){var d=document.documentElement;d.classList.add('js');if(matchMedia('(prefers-reduced-motion: reduce)').matches)d.dataset.intro='done';setTimeout(function(){if(d.dataset.intro!=='done'){d.dataset.intro='done';dispatchEvent(new Event('intro:done'))}},4000)})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anybody.variable} ${onest.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>
        <a
          href="#about"
          className="sr-only z-[200] rounded-full bg-marigold px-5 py-3 font-medium text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
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
