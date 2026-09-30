"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Mark } from "@/components/hand/Marks";
import Lenses from "@/components/Lenses";
import TransitionLink from "@/components/TransitionLink";
import { site } from "@/data/site";
import { gsap } from "@/lib/gsap";
import PaletteSwitcher from "@/components/PaletteSwitcher";

/**
 * Taped to the top of the page: the mark as a round sticker, the links
 * handwritten on a strip of masking tape with a pen squiggle under the section
 * you're in, and availability as a label-maker strip. Tape and labels read on
 * paper and on the dark sections alike, and the name sits on its own paper
 * label, so nothing has to re-theme. Slides away while scrolling down, returns on the way up.
 */
/** On the home page a plain anchor; elsewhere a transition back home. */
function NavLink({ href, label, ...rest }: { href: string; label: string } & React.ComponentProps<"a">) {
  const home = usePathname() === "/";
  if (home) return <a href={href} {...rest} />;
  return (
    <TransitionLink
      href={`/${href}`}
      color="#0b1238"
      label={label}
      {...(rest as Omit<React.ComponentProps<typeof TransitionLink>, "href" | "color" | "label">)}
    />
  );
}

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

  return (
    <header ref={ref} className="fixed inset-x-0 top-0 z-[100] px-3 pt-2 sm:px-5 sm:pt-3" data-intro-hide>
      <nav aria-label="Main" className="flex items-start justify-between gap-3">
        {/* the sticker */}
        <NavLink href="#top" label="Essa" className="group flex items-center gap-2.5 pt-1">
          <span className="grid h-12 w-12 -rotate-[8deg] place-items-center rounded-full bg-[#f7f6f1] shadow-[0_6px_14px_-6px_rgba(0,0,0,0.45)] ring-1 ring-black/5 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:rotate-[6deg] group-hover:scale-105">
            <Lenses draw className="h-9 w-9" ink="#0b1238" accent="#2b3bff" />
          </span>
          <span className="hidden -rotate-2 bg-[#f7f6f1] px-2.5 py-1 text-[15px] font-semibold text-ink shadow-[0_4px_10px_-4px_rgba(0,0,0,0.35)] sm:inline">
            {site.name}
          </span>
        </NavLink>

        {/* the tape */}
        <ul className="nav-tape mt-2.5 hidden items-center gap-7 md:flex">
          {site.nav.map((n) => {
            const on = active === n.href.slice(1);
            return (
              <li key={n.href}>
                <NavLink
                  href={n.href}
                  label={n.label}
                  aria-current={on ? "true" : undefined}
                  className="font-hand relative block text-[22px] leading-none text-[#2d2a26] transition-transform duration-300 hover:-rotate-3"
                >
                  {n.label}
                  {on && (
                    <Mark
                      key={n.href}
                      now
                      kind="squiggle"
                      duration={0.45}
                      className="absolute -bottom-2 -left-1 h-2.5 w-[calc(100%+8px)] text-field"
                      width={5}
                    />
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-3 pt-2.5 md:ml-0">
          <PaletteSwitcher className={`hidden h-11 rounded-full bg-ink/90 px-1.5 text-chalk lg:flex`} />
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="nav-tape font-hand px-5 text-xl leading-none text-[#2d2a26] md:hidden"
          >
            {open ? "close" : "menu"}
          </button>

          <NavLink
            href="#contact"
            label="Contact"
            className="label-tape hidden rotate-2 !text-[13px] transition-transform duration-300 hover:rotate-0 sm:block"
          >
            {site.available ? "AVAILABLE FOR WORK" : "GET IN TOUCH"}
          </NavLink>
        </div>
      </nav>

      {open && (
        <div
          id="mobile-menu"
          className="paper mt-3 rounded-[6px] p-3 text-ink shadow-[0_24px_48px_-20px_rgba(11,18,56,0.5)] md:hidden"
        >
          <ul>
            {site.nav.map((n) => (
              <li key={n.href}>
                <NavLink
                  href={n.href}
                  label={n.label}
                  onClick={() => setOpen(false)}
                  className="display block rounded-2xl px-4 py-3 text-5xl uppercase [--wdth:120] active:bg-ink/5"
                >
                  {n.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className={`mt-2 border-t border-ink/15 px-3 pb-2 pt-4 ${site.features.palettes ? "" : "hidden"}`}>
            <p className="mb-2 text-sm text-ink-muted">Palette</p>
            <PaletteSwitcher labelled className="flex-wrap" />
          </div>
        </div>
      )}
    </header>
  );
}
