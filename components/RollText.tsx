/**
 * Hover text that rolls letter by letter: each letter slides up to reveal an
 * outlined copy underneath. Transform-only, so it never re-lays out the line
 * (the old width-stretch hover did, which is what made it stutter).
 * Hover is driven by the nearest `.roll-host` ancestor.
 */
export default function RollText({ text, className }: { text: string; className?: string }) {
  return (
    <span className={`roll ${className ?? ""}`} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden className="roll-char" style={{ "--i": i } as React.CSSProperties}>
          <span className="roll-a">{ch === " " ? " " : ch}</span>
          <span className="roll-b">{ch === " " ? " " : ch}</span>
        </span>
      ))}
    </span>
  );
}
