"use client";

import { useEffect, useRef, useState } from "react";
import Magnetic from "@/components/Magnetic";
import { site } from "@/data/site";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";

function AmmanTime() {
  const [time, setTime] = useState<string | null>(null);
  useEffect(() => {
    const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: site.timeZone });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return <span className="tabular-nums">{time ?? "--:--"}</span>;
}

export default function Contact() {
  const root = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(".contact-title", {
          type: "lines,words,chars",
          charsClass: "char",
          mask: "lines",
        });
        gsap.from(split.chars, {
          yPercent: 110,
          "--wdth": 50,
          ease: "expo.out",
          duration: 1.4,
          stagger: 0.025,
          scrollTrigger: { trigger: ".contact-title", start: "top 80%" },
          onComplete: () => gsap.set(split.chars, { clearProps: "--wdth" }),
        });
        return () => split.revert();
      });
    },
    { scope: root },
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  return (
    <section
      ref={root}
      id="contact"
      aria-labelledby="contact-title"
      className="relative overflow-hidden bg-cobalt px-4 pb-10 pt-28 text-chalk sm:px-6 md:pt-40"
    >
      <div className="mx-auto max-w-[1400px]">
        <h2 id="contact-title" className="contact-title display text-[clamp(3.5rem,12vw,13rem)] uppercase [--wdth:130]">
          Let’s build the next one
        </h2>

        <div className="mt-14 grid gap-12 md:mt-20 md:grid-cols-12">
          <p className="max-w-[38ch] text-xl leading-snug text-cobalt-muted md:col-span-5">
            I’m open to full-time roles and freelance projects. Tell me what you’re working on and I’ll reply within a
            day.
          </p>

          <div className="md:col-span-7">
            <div className="flex flex-wrap items-center gap-4">
              <Magnetic>
                <button
                  type="button"
                  onClick={copy}
                  data-cursor={copied ? "Copied" : "Copy"}
                  className="group relative flex items-center gap-4 overflow-hidden rounded-full bg-chalk py-4 pl-6 pr-4 text-left text-ink transition-transform duration-300 active:scale-[0.98] sm:py-5 sm:pl-8"
                >
                  <span className="text-lg font-medium sm:text-2xl">{site.email}</span>
                  <span
                    className={`grid h-10 min-w-10 place-items-center rounded-full px-3 text-sm font-medium transition-colors duration-300 ${
                      copied ? "bg-marigold text-ink" : "bg-ink text-chalk"
                    }`}
                  >
                    {copied ? "Copied" : "Copy"}
                  </span>
                </button>
              </Magnetic>
              <a
                href={`mailto:${site.email}`}
                className="rounded-full px-5 py-3 font-medium ring-1 ring-chalk/40 transition-colors duration-300 hover:bg-chalk hover:text-ink"
              >
                Open in your mail app
              </a>
            </div>
            <p aria-live="polite" className="sr-only">
              {copied ? "Email address copied to clipboard" : ""}
            </p>

            <dl className="mt-14 grid grid-cols-2 gap-8 border-t border-chalk/25 pt-6 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-cobalt-muted">Local time in Amman</dt>
                <dd className="mt-1 text-lg font-medium">
                  <AmmanTime />
                </dd>
              </div>
              <div>
                <dt className="text-cobalt-muted">Status</dt>
                <dd className="mt-1 flex items-center gap-2 text-lg font-medium">
                  <span className="h-2 w-2 rounded-full bg-marigold" />
                  {site.available ? "Available" : "Booked"}
                </dd>
              </div>
              <div>
                <dt className="text-cobalt-muted">Elsewhere</dt>
                <dd className="mt-1 flex gap-4 text-lg font-medium">
                  {site.socials.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-chalk/40 underline-offset-4 transition-colors hover:decoration-chalk"
                    >
                      {s.label}
                    </a>
                  ))}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
