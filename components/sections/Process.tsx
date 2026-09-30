"use client";

import HandoffCompare from "@/components/HandoffCompare";
import ProcessStory from "@/components/ProcessStory";

export default function Process() {
  return (
    <section id="process" aria-labelledby="process-title" className="bg-chalk text-ink">
      <div className="px-4 pb-12 pt-28 sm:px-6 md:pb-20 md:pt-40">
        <div className="mx-auto max-w-[1400px]">
          <div className="grid gap-8 md:grid-cols-12">
            <h2
              id="process-title"
              className="display text-[clamp(3rem,7.5vw,7.5rem)] uppercase [--wdth:118] md:col-span-8"
            >
              One person, design to code
            </h2>
            <p className="max-w-[40ch] self-end text-lg leading-snug text-ink-muted md:col-span-4">
              Most projects lose something between the design file and the browser. Mine don’t have that gap. Drag the
              handle to compare the two.
            </p>
          </div>

          <div className="mt-14 md:mt-20">
            <HandoffCompare />
          </div>
        </div>
      </div>
      <ProcessStory />
    </section>
  );
}
