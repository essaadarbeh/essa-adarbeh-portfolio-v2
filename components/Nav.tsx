"use client";

import { useEffect, useRef, useState } from "react";
import { site } from "@/data/site";
import { gsap } from "@/lib/gsap";

/**
 * Three floating pills on an ink glass, so they read on every section colour
 * without re-theming. Slides away while scrolling down, returns on the way up.
 */
export default function Nav() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState<string>("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = ref.current!;
    let lastY = window.scrollY;
    let hidden = false;
    const onScroll = () => {
      const y = window.scrollY;
      const down = y > lastY && y > 160;
      if (down !== hidden && Math.abs(y - lastY) > 4) {
        hidden = down;
        gsap.to(el, { yPercent: down ? -140 : 0, duration: 0.6, ease: "expo.out" });
      }
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // highlight the section in view
    const ids = site.nav.map((n) => n.href.slice(1));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ids.forEach((id) => {
      const s = document.getElementById(id);
      if (s) io.observe(s);
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  const pill = "rounded-full bg-ink/75 text-chalk ring-1 ring-white/10 backdrop-blur-md backdrop-saturate-150";

  return (
    <header ref={ref} className="fixed inset-x-0 top-0 z-[100] px-3 pt-3 sm:px-5 sm:pt-5" data-intro-hide>
      <nav aria-label="Main" className="flex items-center justify-between gap-3">
        <a href="#top" className={`${pill} flex h-11 items-center gap-2 pl-1.5 pr-4 text-sm font-medium`}>
          <span className="grid h-8 w-8 place-items-center rounded-full bg-cobalt font-display text-[13px] font-extrabold [--wdth:130]">
            EA
          </span>
          <span className="hidden sm:inline">{site.name}</span>
        </a>

        <ul className={`${pill} hidden h-11 items-center px-1.5 text-sm md:flex`}>
          {site.nav.map((n) => {
            const on = active === n.href.slice(1);
            return (
              <li key={n.href}>
                <a
                  href={n.href}
                  aria-current={on ? "true" : undefined}
                  className={`relative block rounded-full px-4 py-2 transition-colors duration-300 ${
                    on ? "bg-chalk text-ink" : "text-chalk/80 hover:text-chalk"
                  }`}
                >
                  {n.label}
                </a>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className={`${pill} h-11 px-4 text-sm font-medium md:hidden`}
        >
          {open ? "Close" : "Menu"}
        </button>

        <a href="#contact" className={`${pill} hidden h-11 sm:flex items-center gap-2.5 px-4 text-sm font-medium`}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-marigold opacity-60 motion-reduce:hidden" />
            <span className="relative h-2 w-2 rounded-full bg-marigold" />
          </span>
          {site.available ? "Available for work" : "Get in touch"}
        </a>
      </nav>

      {open && (
        <div id="mobile-menu" className="mt-3 rounded-[28px] bg-ink/90 p-3 text-chalk backdrop-blur-md md:hidden">
          <ul>
            {site.nav.map((n) => (
              <li key={n.href}>
                <a
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="display block rounded-2xl px-4 py-3 text-5xl uppercase [--wdth:120] active:bg-white/10"
                >
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
