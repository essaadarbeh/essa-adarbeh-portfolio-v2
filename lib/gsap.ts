"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  guardContexts();
}

/**
 * GSAP runs ScrollTrigger callbacks inside the context that created them, and
 * a context that runs while another one is active gets filed under it. So a
 * callback firing while a different section is setting up files the two
 * contexts under each other, and reverting either (leaving the page, going
 * back) recurses until the stack overflows. An existing context re-entering
 * later (a callback, not its first run) now runs detached from whatever is
 * active; new contexts still nest as usual. Kill and getTweens are also made
 * safe against any cycle that slips through.
 */
function guardContexts() {
  type Ctx = {
    last?: unknown;
    add: (...a: unknown[]) => unknown;
    kill: (...a: unknown[]) => unknown;
    getTweens: () => unknown[];
    ignore: (f: () => void) => void;
    __busy?: boolean;
  };
  const proto = Object.getPrototypeOf(gsap.context(() => {})) as Ctx;
  if ((proto as { __guarded?: boolean }).__guarded) return;
  (proto as { __guarded?: boolean }).__guarded = true;

  const add = proto.add;
  proto.add = function (this: Ctx, ...args: unknown[]) {
    const active = gsap.context() as unknown as Ctx | undefined;
    if (active && active !== this && this.last && typeof args[0] === "function") {
      let result: unknown;
      active.ignore(() => {
        result = add.apply(this, args);
      });
      return result;
    }
    return add.apply(this, args);
  };

  const getTweens = proto.getTweens;
  proto.getTweens = function (this: Ctx) {
    if (this.__busy) return [];
    this.__busy = true;
    try {
      return getTweens.call(this);
    } finally {
      this.__busy = false;
    }
  };

  const kill = proto.kill;
  proto.kill = function (this: Ctx & { __killing?: boolean }, ...args: unknown[]) {
    if (this.__killing) return;
    this.__killing = true;
    try {
      return kill.apply(this, args);
    } finally {
      this.__killing = false;
    }
  };
}

export const EASE_OUT = "expo.out";

/** Resolves when the hero intro has finished (or immediately if it already has). */
export const INTRO_DONE = "intro:done";
export function onIntroDone(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  if (document.documentElement.dataset.intro === "done") {
    cb();
    return () => {};
  }
  window.addEventListener(INTRO_DONE, cb, { once: true });
  return () => window.removeEventListener(INTRO_DONE, cb);
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
