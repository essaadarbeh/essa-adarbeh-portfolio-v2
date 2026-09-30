"use client";

import { useEffect, useRef } from "react";

/**
 * Hover the hero portrait and it turns into a Figma canvas for a moment: a
 * selection frame snaps around the head, two multiplayer cursors (the
 * designer and the developer, both Essa) drift in, and a few FigJam-style
 * stickers get slapped on. The eraser underneath keeps working. On touch, a
 * tap toggles it, together with the sketch. Pure CSS transitions, driven by
 * one data attribute, so hovering never re-renders React or the portrait.
 */
export default function FigmaStickers({ host }: { host: React.RefObject<HTMLElement | null> }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    const box = root.current;
    if (!el || !box) return;
    const set = (on: boolean) => (box.dataset.on = on ? "true" : "false");
    const fine = matchMedia("(pointer: fine)").matches;
    const enter = () => set(true);
    const leave = () => set(false);
    const tap = () => set(box.dataset.on !== "true");
    if (fine) {
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
    } else el.addEventListener("click", tap);
    return () => {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("click", tap);
    };
  }, [host]);

  return (
    <div ref={root} data-on="false" aria-hidden className="fs pointer-events-none absolute inset-0 z-10">
      {/* selection frame around the head */}
      <div className="fs-frame absolute left-[4%] top-[1%] h-[44%] w-[86%] md:left-[1%] md:w-[101%]">
        <span className="absolute -top-[22px] left-0 hidden font-sans md:block text-[11px] font-medium text-[#0d99ff]">
          # Essa
        </span>
        {[
          "left-0 top-0",
          "left-1/2 top-0",
          "right-0 top-0",
          "right-0 top-1/2",
          "right-0 bottom-0",
          "left-1/2 bottom-0",
          "left-0 bottom-0",
          "left-0 top-1/2",
        ].map((p) => (
          <span
            key={p}
            className={`absolute ${p} h-2 w-2 -translate-x-1/2 -translate-y-1/2 border-[1.5px] border-[#0d99ff] bg-white`}
            style={p.includes("right-0") ? { transform: "translate(50%, -50%)" } : undefined}
          />
        ))}
        <span className="absolute -bottom-[26px] left-1/2 -translate-x-1/2 rounded-[3px] bg-[#0d99ff] px-1.5 py-0.5 font-sans text-[11px] font-medium text-white">
          Hug × Hug
        </span>
      </div>

      {/* the two of me, working on the same file */}
      <Cursor
        name="Designer"
        color="#9747ff"
        className="left-[62%] top-[7%] md:left-[80%] md:top-[9%]"
        i={2}
        drift="a"
      />
      <Cursor name="Developer" color="#14ae5c" className="left-[-14%] top-[40%]" i={3} drift="b" />

      {/* FigJam stickers, slapped on */}
      <Sticker className="left-[50%] top-[2%] w-[15%]" r={-14} i={4}>
        <path
          d="M20 2 C21.5 12 28 18.5 38 20 C28 21.5 21.5 28 20 38 C18.5 28 12 21.5 2 20 C12 18.5 18.5 12 20 2 Z"
          fill="#ffc24b"
        />
      </Sticker>
      <Sticker className="left-[70%] top-[21%] w-[14%]" r={12} i={5}>
        <path
          d="M20 35 C8 26 3 19.5 3 13 C3 7.6 7 4 11.6 4 C15 4 18 6 20 9.4 C22 6 25 4 28.4 4 C33 4 37 7.6 37 13 C37 19.5 32 26 20 35 Z"
          fill="#ff6fb5"
        />
      </Sticker>
      <Sticker className="left-[52%] top-[31%] w-[16%]" r={-8} i={6} label="+1">
        <circle cx="20" cy="20" r="17" fill="#9747ff" />
      </Sticker>

      {/* a comment pinned on the glasses */}
      <div
        className="fs-item absolute left-[18%] top-[16%]"
        style={{ "--i": 7, "--r0": "-6deg", "--r": "0deg" } as React.CSSProperties}
      >
        <span className="flex items-center gap-2 rounded-[18px] rounded-bl-[4px] bg-white py-1.5 pl-1.5 pr-3 font-sans text-[13px] font-medium text-[#1e1e1e] shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_22px_-6px_rgba(0,0,0,0.3)]">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-field text-[11px] font-semibold text-white">
            E
          </span>
          ship it ✓
        </span>
      </div>
    </div>
  );
}

function Cursor({
  name,
  color,
  className,
  i,
  drift,
}: {
  name: string;
  color: string;
  className: string;
  i: number;
  drift: "a" | "b";
}) {
  return (
    <div
      className={`fs-item absolute ${className}`}
      style={{ "--i": i, "--r0": "0deg", "--r": "0deg" } as React.CSSProperties}
    >
      <div className={`fs-drift-${drift}`}>
        <svg width="20" height="22" viewBox="0 0 20 22" className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]">
          <path
            d="M2 1.5 L2 17.5 L6.4 13.4 L9.4 20.2 L12.4 18.9 L9.5 12.3 L15.5 12.1 Z"
            fill={color}
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <span
          className="-mt-1 ml-3.5 block w-max rounded-[4px] rounded-tl-none px-1.5 py-0.5 font-sans text-[12px] font-medium text-white"
          style={{ background: color }}
        >
          {name}
        </span>
      </div>
    </div>
  );
}

/** A die-cut sticker: thick white border, soft shadow, slapped on at an angle. */
function Sticker({
  children,
  className,
  r,
  i,
  label,
}: {
  children: React.ReactNode;
  className: string;
  r: number;
  i: number;
  label?: string;
}) {
  return (
    <div
      className={`fs-item absolute ${className}`}
      style={{ "--i": i, "--r0": `${r - 30}deg`, "--r": `${r}deg` } as React.CSSProperties}
    >
      <svg viewBox="-4 -4 48 48" className="block h-auto w-full drop-shadow-[0_6px_8px_rgba(0,0,0,0.3)]">
        <g stroke="#fff" strokeWidth="6" strokeLinejoin="round" style={{ paintOrder: "stroke" }}>
          {children}
        </g>
        {label && (
          <text
            x="20"
            y="26"
            textAnchor="middle"
            fontSize="16"
            fontWeight="800"
            fill="#fff"
            fontFamily="system-ui, sans-serif"
          >
            {label}
          </text>
        )}
      </svg>
    </div>
  );
}
