import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { site } from "@/data/site";
import { lensesSvg } from "@/lib/lenses";

export const alt = `${site.name}, ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  const portrait = await readFile(path.join(process.cwd(), "app", "og-portrait.png"));
  const src = `data:image/png;base64,${portrait.toString("base64")}`;
  const mark = `data:image/svg+xml;base64,${Buffer.from(lensesSvg("#eef0f6", "#ffc24b")).toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#2b3bff",
        color: "#eef0f6",
        position: "relative",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, width: 780 }}
      >
        <img src={mark} alt="" width={110} height={110} style={{ marginLeft: -12, marginTop: -20 }} />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 120,
            fontWeight: 800,
            lineHeight: 0.9,
            letterSpacing: -4,
          }}
        >
          <span>ESSA</span>
          <span>ADARBEH</span>
        </div>
        <div style={{ display: "flex", fontSize: 32, color: "#d6dbff" }}>{site.role}, Amman</div>
      </div>
      <img src={src} alt="" width={297} height={630} style={{ position: "absolute", right: 90, bottom: 0 }} />
    </div>,
    size,
  );
}
