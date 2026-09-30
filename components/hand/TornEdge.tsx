/**
 * The ragged edge of a page torn out of the notebook. It sits where a paper
 * section meets a screen section, so the page visibly ends and the build
 * begins. Static SVG, stretched to any width.
 */
const EDGE =
  "M0 0 H1200 V18.8 L1188.0 17.2 L1158.0 16.8 L1153.0 16.5 L1137.0 18.8 L1121.0 15.2 L1116.0 16.0 L1086.0 17.8 L1070.0 17.2 L1048.0 21.0 L1032.0 20.5 L1023.0 19.4 L1018.0 18.6 L988.0 16.6 L958.0 16.6 L946.0 18.3 L941.0 15.1 L932.0 12.5 L902.0 14.1 L897.0 10.4 L875.0 11.5 L853.0 10.2 L848.0 10.2 L839.0 12.1 L834.0 9.5 L829.0 12.7 L824.0 11.9 L812.0 9.3 L807.0 10.0 L800.0 13.3 L770.0 12.3 L763.0 14.4 L756.0 14.5 L734.0 16.4 L722.0 13.4 L715.0 14.6 L685.0 18.0 L663.0 12.3 L647.0 17.2 L638.0 15.3 L633.0 15.4 L628.0 15.0 L623.0 15.6 L601.0 16.6 L585.0 13.4 L563.0 14.1 L551.0 13.0 L546.0 13.0 L524.0 15.7 L515.0 13.3 L485.0 17.4 L455.0 11.9 L443.0 18.8 L438.0 25.7 L416.0 26.4 L404.0 20.8 L395.0 21.9 L373.0 26.6 L364.0 24.3 L342.0 23.6 L320.0 24.7 L311.0 20.1 L281.0 23.0 L269.0 20.1 L262.0 19.4 L240.0 18.1 L235.0 19.4 L205.0 20.6 L183.0 22.9 L174.0 16.2 L152.0 18.8 L130.0 19.5 L118.0 18.4 L111.0 19.9 L99.0 17.6 L94.0 15.9 L85.0 13.6 L69.0 20.7 L39.0 19.5 L27.0 21.5 L22.0 25.6 L15.0 19.7 L3.0 19.7 L0 16.3 Z";

const RAG =
  "M1200 18 L1188 21 L1171 16 L1152 24 L1139 19 L1118 26 L1101 18 L1086 22 L1064 15 L1049 23 L1027 20 L1012 27 L993 19 L975 24 L958 17 L937 25 L919 21 L902 28 L884 19 L861 23 L846 16 L828 24 L806 20 L791 26 L770 18 L752 22 L733 15 L716 25 L697 19 L679 27 L660 20 L642 24 L621 17 L604 23 L587 18 L566 26 L549 21 L530 28 L512 19 L493 24 L474 16 L457 22 L436 19 L419 27 L401 20 L383 25 L362 17 L345 23 L326 19 L309 26 L290 18 L272 24 L251 21 L234 28 L216 18 L197 23 L178 16 L161 25 L142 20 L124 26 L105 18 L87 23 L68 17 L51 24 L32 19 L15 25 L0 20";

export default function TornEdge({ side, className }: { side: "top" | "bottom"; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1200 30"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 z-10 h-5 w-full md:h-7 ${
        side === "top" ? "top-0" : "bottom-0 rotate-180"
      } ${className ?? ""}`}
    >
      <path d={EDGE} fill="var(--color-chalk)" />
      {/* the torn fibres catch a little shadow */}
      <path
        d={RAG}
        fill="none"
        stroke="rgb(11 18 56 / 0.12)"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
        transform="translate(0 1.5)"
      />
    </svg>
  );
}
