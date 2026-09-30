"use client";

import { DrawScope, Mark, Written } from "@/components/hand/Marks";
import HandoffCompare from "@/components/HandoffCompare";
import ProcessStory from "@/components/ProcessStory";

export default function Process() {
  return (
    <section id="process" aria-labelledby="process-title" className="paper text-ink">
      <div className="px-4 pb-12 pt-28 sm:px-6 md:pb-20 md:pt-40">
        <div className="mx-auto max-w-[1400px]">
          <DrawScope className="grid gap-8 md:grid-cols-12">
            <h2
              id="process-title"
              className="display text-[clamp(3rem,7.5vw,7.5rem)] uppercase [--wdth:118] md:col-span-8"
            >
              One person,{" "}
              <span className="relative -mx-[0.12em] -my-[0.1em] inline-block px-[0.12em] py-[0.1em]">
                design
                <Mark kind="circle" delay={0.3} duration={0.8} className="absolute inset-0 h-full w-full text-field" />
              </span>{" "}
              to{" "}
              <span className="relative inline-block">
                code
                <Mark
                  kind="underline"
                  delay={1.1}
                  duration={0.5}
                  className="absolute -bottom-[0.06em] left-0 h-[0.2em] w-full text-signal"
                  width={5}
                />
              </span>
            </h2>
            <div className="self-end md:col-span-4">
              <p className="max-w-[40ch] text-lg leading-snug text-ink-muted">
                Most projects lose something between the design file and the browser. Mine don’t have that gap. Drag the
                handle to compare the two.
              </p>
              <span className="mt-4 flex items-end gap-1">
                <Written className="rotate-[-2deg] text-xl text-field" delay={1.6}>
                  same card, both sides
                </Written>
                <Mark kind="arrow" delay={2.4} duration={0.45} className="mb-[-2rem] h-12 w-14 text-field" width={3} />
              </span>
            </div>
          </DrawScope>

          <div className="mt-14 md:mt-20">
            <HandoffCompare />
          </div>
        </div>
      </div>
      <ProcessStory />
    </section>
  );
}
