"use client";

import { palettes } from "@/lib/palettes";
import { setPalette, usePalette } from "@/lib/palette-client";
import { site } from "@/data/site";

/** A row of swatches. Each shows its field colour with the signal as a dot. */
export default function PaletteSwitcher({ className, labelled }: { className?: string; labelled?: boolean }) {
  const active = usePalette();
  if (!site.features.palettes) return null;

  return (
    <div role="radiogroup" aria-label="Colour palette" className={`flex items-center gap-1.5 ${className ?? ""}`}>
      {palettes.map((p) => {
        const on = p.id === active.id;
        return (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${p.name} palette`}
            title={p.name}
            data-cursor={p.name}
            onClick={(e) => setPalette(p.id, { x: e.clientX, y: e.clientY })}
            className={`group flex items-center gap-2 rounded-full ${labelled ? "py-1 pl-1 pr-3" : "p-1"} transition-colors duration-300 ${
              on ? "bg-chalk/15" : "hover:bg-chalk/10"
            }`}
          >
            <span
              className={`relative grid h-6 w-6 place-items-center rounded-full ring-2 transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-110 ${
                on ? "ring-chalk" : "ring-transparent"
              }`}
              style={{ background: p.field }}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: p.signal }} />
            </span>
            {labelled && <span className="text-sm">{p.name}</span>}
          </button>
        );
      })}
    </div>
  );
}
