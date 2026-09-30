export type Project = {
  slug: string;
  title: string;
  summary: string;
  year: string;
  role: string;
  description: string;
  facts: string[];
  cover: { src: string; width: number; height: number };
  href: string;
  /** Section colours while this project is on screen. */
  theme: { bg: string; fg: string; muted: string };
  /** The project's own brand colour, used for accents on its case study. */
  accent: string;
  tools: string;
};

export const projects: Project[] = [
  {
    slug: "lumen",
    title: "Lumen",
    summary: "Product analytics, made readable",
    year: "2026",
    role: "UI/UX and design system",
    description:
      "A data-dense SaaS analytics dashboard built from the token layer up, so a colour, a radius or a type size changes once and lands everywhere. Ten screens on one system, wired as a clickable prototype.",
    facts: ["Design system", "Figma variables", "10 screens", "Prototype"],
    cover: { src: "/project-lumen.png", width: 1600, height: 1000 },
    href: "https://www.figma.com/design/73pgXNn3lV15mu0GNY3C2t/Lumen-Analytics?node-id=63-1062",
    theme: { bg: "#E4E7FF", fg: "#0B1238", muted: "#454C78" },
    accent: "#4f46e5",
    tools: "Figma, variables, auto layout, prototyping",
  },
  {
    slug: "atlas",
    title: "Atlas",
    summary: "An AI research agent",
    year: "2026",
    role: "Product design",
    description:
      "An agentic research tool where the real design problem is showing what the machine is doing, and knowing when it should stop and ask permission. A two-mode system, dark and light, from one set of variables.",
    facts: ["Dark and light modes", "Figma variables", "7 screens", "Prototype"],
    cover: { src: "/project-atlas.png", width: 1600, height: 1000 },
    href: "https://www.figma.com/design/2InYyu117QpzCMzni2fhve/Atlas-%E2%80%94-AI-Research-Agent?node-id=34-718",
    theme: { bg: "#150C33", fg: "#EEF0F6", muted: "#A9A3CC" },
    accent: "#a78bfa",
    tools: "Figma, variables with two modes, prototyping",
  },
];
