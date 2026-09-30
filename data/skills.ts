export type ToolCategory = "design" | "frontend" | "craft" | "ai" | "human";

export const categories: { id: ToolCategory; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "frontend", label: "Frontend" },
  { id: "craft", label: "Craft" },
  { id: "ai", label: "AI" },
  { id: "human", label: "Human" },
];

export type Tool = { name: string; category: ToolCategory; note: string };

/** The toolkit, one tool per key of a QWERTY keyboard. */
export const tools: Record<string, Tool> = {
  F: {
    name: "Figma",
    category: "design",
    note: "Where every project starts. Variables, auto layout and prototypes, organised so a developer can read the file.",
  },
  D: {
    name: "Design systems",
    category: "design",
    note: "Tokens first, components second. Lumen and Atlas both run on one set of variables.",
  },
  P: {
    name: "Prototypes",
    category: "design",
    note: "Clickable flows before any code, so the hard questions come up while they’re cheap.",
  },
  Z: {
    name: "Wireframes",
    category: "design",
    note: "Grey boxes and real copy. Structure gets agreed before colour gets argued about.",
  },
  U: {
    name: "UX research",
    category: "design",
    note: "Interviews, task tests and a lot of watching people use things.",
  },
  I: {
    name: "Interaction design",
    category: "design",
    note: "States, transitions and feedback: what happens after every click.",
  },
  T: { name: "TypeScript", category: "frontend", note: "Types everywhere. The compiler catches what a review misses." },
  R: { name: "React", category: "frontend", note: "Component-driven, with the design system mapped one to one." },
  N: {
    name: "Next.js",
    category: "frontend",
    note: "This site runs on it: server rendering, image optimisation, fast by default.",
  },
  W: {
    name: "Tailwind CSS",
    category: "frontend",
    note: "Design tokens as utility classes, so the code and the Figma file share one vocabulary.",
  },
  G: {
    name: "GSAP",
    category: "frontend",
    note: "Scroll-linked motion and text effects, including every animation on this page.",
  },
  M: { name: "Framer Motion", category: "frontend", note: "Layout and gesture animation inside React apps." },
  J: {
    name: "three.js",
    category: "frontend",
    note: "WebGL for the portraits here: palette mapping, the lens and the code view.",
  },
  H: {
    name: "HTML & CSS",
    category: "frontend",
    note: "Semantic markup and modern CSS: container queries, :has(), view transitions.",
  },
  A: {
    name: "Accessibility",
    category: "craft",
    note: "WCAG AA as the floor: keyboard paths, visible focus, contrast checked for every palette.",
  },
  L: { name: "Responsive layout", category: "craft", note: "Designed at phone width first, then allowed to grow." },
  E: {
    name: "Micro-interactions",
    category: "craft",
    note: "The small responses that make an interface feel alive. This keyboard, for one.",
  },
  V: {
    name: "Performance",
    category: "craft",
    note: "Budgets for JavaScript and paint. three.js on this page only loads when a portrait needs it.",
  },
  K: {
    name: "Design tokens",
    category: "craft",
    note: "One source for colour, type and spacing, shared by Figma and code.",
  },
  C: {
    name: "Claude Code",
    category: "ai",
    note: "My pair programmer for scaffolding, refactors and the repetitive half of the job.",
  },
  B: {
    name: "AI pair programming",
    category: "ai",
    note: "Faster first drafts, with me reviewing every line that ships.",
  },
  S: { name: "Rapid prototyping", category: "ai", note: "An idea on Monday, something clickable by Tuesday." },
  X: {
    name: "Design exploration",
    category: "ai",
    note: "Generating directions quickly, then choosing between them with taste.",
  },
  Q: {
    name: "Questions",
    category: "human",
    note: "Not a tool, a habit. The first week of any project is mostly questions.",
  },
  Y: { name: "Why", category: "human", note: "Every feature has to answer it before it gets designed." },
  O: {
    name: "Open to work",
    category: "human",
    note: "Full-time roles and freelance projects. Press Enter to get in touch.",
  },
};

export const keyRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export const process = [
  {
    title: "Understand",
    text: "I map the user, the goal and the constraints before drawing anything. For Atlas, that meant one question first: when should the agent stop and ask?",
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
    text: "Micro-interactions, performance budgets and the edge cases: empty states, errors, slow connections.",
  },
];
