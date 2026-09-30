export type SkillGroup = { lead: string; items: string[] };

/** Each group reads as one sentence: lead + items. */
export const skillGroups: SkillGroup[] = [
  {
    lead: "I design in",
    items: ["Figma", "Design systems", "Prototypes", "Wireframes", "UX research", "Interaction design"],
  },
  {
    lead: "and build with",
    items: ["TypeScript", "React", "Next.js", "Tailwind CSS", "GSAP", "Framer Motion", "three.js"],
  },
  {
    lead: "while sweating",
    items: ["Accessibility", "Responsive layout", "Micro-interactions", "Performance", "Design tokens"],
  },
  {
    lead: "and moving fast with",
    items: ["Claude Code", "AI pair programming", "Rapid prototyping", "Design exploration"],
  },
];

export const process = [
  {
    title: "Understand",
    text: "Every project starts with the problem, not the pixels. I map the user, the goal and the constraints so the design solves something real.",
  },
  {
    title: "Design",
    text: "Wireframes to high fidelity, a type and colour system, and motion planned as part of the design instead of bolted on afterwards.",
  },
  {
    title: "Build",
    text: "The design becomes fast, component-driven code: pixel-accurate, responsive by default, keyboard-friendly from the first commit.",
  },
  {
    title: "Polish",
    text: "The last ten percent that reads as premium: micro-interactions, performance budgets, edge cases. Products, not demos.",
  },
];
