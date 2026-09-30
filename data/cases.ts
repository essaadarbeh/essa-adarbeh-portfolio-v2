// Case-study content. System facts (token counts, component variants, type
// choices) are read from the Lumen and Atlas Figma files; the narrative is
// written from the project descriptions. No invented metrics.

export type FlowStep = { label: string; detail: string };
export type Stat = { value: string; label: string };
export type Component = { name: string; variants: string; count: number };

export type Case = {
  slug: "lumen" | "atlas";
  lede: string;
  brief: string[];
  approach: { title: string; text: string }[];
  flow: { title: string; intro: string; steps: FlowStep[]; branch?: { at: number; label: string; detail: string } };
  compare: { title: string; intro: string; left: string; right: string };
  stats: Stat[];
  components: Component[];
  demoIntro: string;
  learned: string;
};

export const cases: Record<Case["slug"], Case> = {
  lumen: {
    slug: "lumen",
    lede: "Analytics dashboards fail in a predictable way: every chart shouts, and nothing says what to do next. Lumen is a product analytics tool designed to be read, not decoded.",
    brief: [
      "The goal was a data-dense SaaS dashboard that still reads calmly: activation, engagement and revenue on one screen, each with enough context to act on.",
      "It also had to scale. Ten screens share one foundation, so the system had to be decided before the screens, not reverse-engineered from them.",
    ],
    approach: [
      {
        title: "Tokens before screens",
        text: "Colour, type, spacing, radius and elevation were set up as Figma variables first, with a semantic layer (bg/surface, text/secondary, border/default) aliasing the primitives. A change lands once and reaches every screen.",
      },
      {
        title: "Numbers that explain themselves",
        text: "Every metric card carries its comparison period and a direction chip, so a number is never shown without the context to judge it.",
      },
      {
        title: "A calm hierarchy",
        text: "Inter for interface text, JetBrains Mono for identifiers and event names. One brand colour does the work; status colours only appear when something has actually changed.",
      },
    ],
    flow: {
      title: "The flow the IA is built around",
      intro:
        "The navigation follows the question a product team actually asks when a number moves. Select a step to see what the screen is for.",
      steps: [
        {
          label: "Overview",
          detail:
            "The morning check. Four headline metrics with deltas, one chart of active users, and the events and channels behind them.",
        },
        {
          label: "Spot the change",
          detail:
            "Weekly retention is down. The red chip and the comparison line make the drop obvious without reading a single axis.",
        },
        {
          label: "Reports",
          detail: "Saved views for the recurring questions, so the same analysis isn’t rebuilt every week.",
        },
        {
          label: "Audience",
          detail: "Segment the drop: new against returning users, plan, region. Where is it actually coming from?",
        },
        {
          label: "Events",
          detail:
            "The raw behaviour behind the segment, with event names in monospace so they match what engineers see in code.",
        },
        { label: "Integrations", detail: "If a source is missing, connect it here, and the numbers upstream fill in." },
      ],
    },
    compare: {
      title: "From wireframe to system",
      intro:
        "The same Overview, at the same coordinates. Drag to see how little moved between structure and finish: the layout was settled in grey before any colour went in.",
      left: "Wireframe",
      right: "Final",
    },
    stats: [
      { value: "10", label: "screens on one system" },
      { value: "19", label: "text styles" },
      { value: "44", label: "icons on a 24px grid" },
      { value: "8", label: "semantic colour aliases" },
    ],
    components: [
      { name: "Button", variants: "Primary, Secondary, Ghost, Danger × 3 sizes × 3 states", count: 36 },
      { name: "Input", variants: "Default, Hover, Focus, Error, Disabled", count: 5 },
      { name: "Badge", variants: "Neutral, Brand, Success, Warning, Danger", count: 5 },
      { name: "Sparkline", variants: "Rising, Steady, Falling, Volatile", count: 4 },
      { name: "Checkbox", variants: "Unchecked, Checked, Indeterminate, Disabled", count: 4 },
      { name: "Toast", variants: "Success, Error, Info", count: 3 },
      { name: "Toggle", variants: "Off, On, Disabled", count: 3 },
      { name: "Nav item", variants: "Default, Hover, Active", count: 3 },
      { name: "Avatar", variants: "Small, Medium, Large", count: 3 },
      { name: "Stat card", variants: "Label, value, delta, sparkline, caption", count: 1 },
    ],
    demoIntro:
      "The stat card, rebuilt from its Figma spec. Change a token and watch it land on every card; switch the range, or hover a sparkline to read it.",
    learned:
      "Designing the semantic layer first feels slower at the start and pays back every time something changes. It is also why the live demo on this page is a matter of wiring tokens, not redrawing cards.",
  },
  atlas: {
    slug: "atlas",
    lede: "An AI research agent does work you can’t watch. Atlas is designed around that problem: showing what the machine is doing, and knowing when it should stop and ask.",
    brief: [
      "Agentic tools tend to hide their work behind a spinner and then present a confident answer. People can’t trust what they can’t see, and they shouldn’t have to.",
      "Atlas needed a way to make a long, multi-step run legible: the plan, each tool call, its cost, and the moments that need a human decision.",
    ],
    approach: [
      {
        title: "Colour encodes who acted",
        text: "The token system has two actors, not just two modes: teal is you, violet is the agent. A glance tells you whether something was your decision or the machine’s.",
      },
      {
        title: "A plan you can edit",
        text: "Atlas drafts the plan from your brief before it starts, and every step stays editable. The run follows a plan you agreed to, not one it made up along the way.",
      },
      {
        title: "Permission as a first-class moment",
        text: "When the agent needs to reach further (a private workspace, extra searches, more budget) it stops and asks, with the cost stated. Deny is as easy as approve.",
      },
    ],
    flow: {
      title: "A research run, start to finish",
      intro: "Every run has the same shape. Select a step to see what the interface does at that moment.",
      steps: [
        {
          label: "Brief",
          detail:
            "Describe the question the way you’d brief a colleague. Atlas estimates time and cost before anything runs.",
        },
        { label: "Plan", detail: "Atlas drafts the steps. Each one is editable, so scope is agreed up front." },
        {
          label: "Run",
          detail:
            "Tool calls stream into the activity feed: web_search, read_source, extract_data, each with its duration and status.",
        },
        {
          label: "Permission",
          detail:
            "Before reaching further, Atlas stops and asks, stating what it wants to access and what it will cost.",
        },
        {
          label: "Report",
          detail:
            "Findings are set in Source Serif as a reading surface, not a chat log, with every claim cited back to a source.",
        },
      ],
      branch: {
        at: 3,
        label: "If you deny",
        detail:
          "The step is marked skipped, and the report flags the affected figures as unverified instead of guessing.",
      },
    },
    compare: {
      title: "One set of variables, two modes",
      intro:
        "Every token is one variable with two values, and the light screens are produced by switching mode, not by redrawing. Drag between them.",
      left: "Dark",
      right: "Light",
    },
    stats: [
      { value: "7", label: "screens, in both modes" },
      { value: "26", label: "semantic tokens × 2 modes" },
      { value: "3", label: "typefaces, each with one job" },
      { value: "56", label: "icons on a 24px grid" },
    ],
    components: [
      { name: "Button", variants: "Primary, Agent, Secondary, Ghost, Danger × 3 sizes × 3 states", count: 45 },
      { name: "Tool call card", variants: "Search, Read, Extract × Running, Done, Failed", count: 9 },
      { name: "Badge", variants: "Neutral, Brand, Agent, Success, Warning, Danger, Info", count: 7 },
      { name: "Input", variants: "Default, Hover, Focus, Error, Disabled", count: 5 },
      { name: "Plan step", variants: "Pending, Active, Done, Skipped", count: 4 },
      { name: "Nav item", variants: "Default, Hover, Active", count: 3 },
      { name: "Toggle", variants: "Off, On, Disabled", count: 3 },
      { name: "Citation", variants: "Default, Hover", count: 2 },
      { name: "Approval card", variants: "Title, body with cost, Deny / Always allow / Approve", count: 1 },
      { name: "Source card", variants: "Domain, title, excerpt", count: 1 },
    ],
    demoIntro:
      "A research run, rebuilt from the Atlas components. Watch the plan execute, and decide what happens when Atlas asks for permission.",
    learned:
      "The approval card is the smallest component in the system and the one that matters most. Its tone, clear about cost and never pushy, sets how much people trust everything else the agent does.",
  },
};
