import { site } from "@/data/site";

export default function Footer() {
  return (
    <footer className="bg-ink px-4 pb-6 pt-16 text-chalk sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-chalk-muted">
          <p>Designed and built by me, with Next.js, GSAP and three.js.</p>
          <a
            href="#top"
            className="rounded-full px-4 py-2 ring-1 ring-chalk/25 transition-colors hover:bg-chalk hover:text-ink"
          >
            Back to top
          </a>
        </div>
        {/* SVG text with textLength always spans the container exactly */}
        <svg viewBox="0 0 1000 150" className="mt-10 w-full" role="img" aria-label={site.name}>
          <text
            x="0"
            y="138"
            textLength="1000"
            lengthAdjust="spacingAndGlyphs"
            className="fill-chalk font-display font-extrabold uppercase"
            style={{ fontSize: 176, fontVariationSettings: '"wdth" 60' }}
          >
            {site.name}
          </text>
        </svg>
        <p className="mt-6 text-sm text-chalk-muted">
          © {new Date().getFullYear()} {site.name}
        </p>
      </div>
    </footer>
  );
}
