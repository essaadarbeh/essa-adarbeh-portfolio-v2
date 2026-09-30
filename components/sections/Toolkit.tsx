import { Fragment } from "react";
import { skillGroups } from "@/data/skills";

/**
 * Four sentences rather than a logo wall: each lead is quiet body text and
 * the tools are set large.
 */
export default function Toolkit() {
  return (
    <section id="toolkit" aria-labelledby="toolkit-title" className="bg-ink px-4 py-28 text-chalk sm:px-6 md:py-40">
      <div className="mx-auto max-w-[1400px]">
        <h2 id="toolkit-title" className="text-sm font-medium text-chalk-muted">
          Toolkit
        </h2>
        <div className="mt-10 space-y-10 md:space-y-14">
          {skillGroups.map((g) => (
            <p key={g.lead} className="max-w-[1250px] leading-[1.02]">
              <span className="mr-4 align-[0.6em] text-base text-chalk-muted md:text-lg">{g.lead}</span>
              {g.items.map((item, i) => (
                // item and its separator never split across lines
                <Fragment key={item}>
                  <span className="whitespace-nowrap">
                    <span className="display inline-block text-[clamp(1.9rem,4.6vw,4.5rem)] uppercase transition-colors duration-300 [--wdth:80] hover:text-sky">
                      {item}
                    </span>
                    {i < g.items.length - 1 && (
                      <>
                        <span
                          aria-hidden
                          className="mx-3 inline-block h-2 w-2 -translate-y-[0.6em] rounded-full bg-cobalt md:mx-4"
                        />
                        <span className="sr-only">, </span>
                      </>
                    )}
                  </span>{" "}
                </Fragment>
              ))}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
