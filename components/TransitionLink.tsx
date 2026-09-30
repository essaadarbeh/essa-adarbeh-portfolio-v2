"use client";

import Link from "next/link";
import { ROUTE_EVENT, type RouteDetail } from "@/components/PageTransition";

type Props = Omit<React.ComponentProps<typeof Link>, "href"> & {
  href: string;
  /** Colour of the transition overlay (usually the destination's). */
  color: string;
  fg?: string;
  /** Word shown on the overlay while the page changes. */
  label: string;
};

/** A Next link that plays the page transition. Modified clicks open normally. */
export default function TransitionLink({ href, color, fg = "#eef0f6", label, onClick, ...rest }: Props) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        const detail: RouteDetail = { href, color, fg, label, x: e.clientX, y: e.clientY };
        window.dispatchEvent(new CustomEvent(ROUTE_EVENT, { detail }));
      }}
      {...rest}
    />
  );
}
