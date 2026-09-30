# Essa Adarbeh — portfolio v2

A ground-up redesign of [essa-adarbeh.vercel.app](https://essa-adarbeh.vercel.app), in its own codebase. The original portfolio is untouched.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint && npm run typecheck
npm run bake       # regenerate portrait textures (see below)
node scripts/check-palettes.mjs   # contrast check for every palette
```

It deploys to Vercel as-is: import the repo, no settings needed. Once the domain is final, set `NEXT_PUBLIC_SITE_URL` so share images resolve.

## Stack

- **Next.js 15** (App Router, one static page), **React 19**, **TypeScript**, **Tailwind CSS 4**
- **GSAP 3** with ScrollTrigger and SplitText for scroll-linked and text animation
- **Lenis** for smooth scrolling on desktop, driven from GSAP's ticker. Touch screens keep native scrolling.
- **three.js** for the portrait shader, loaded only when a portrait is about a screen away

## Palettes

Five palettes, all taken from Jordan: **Cobalt**, **Petra**, **Dead Sea**, **Wadi Rum** and **Olive**. They're defined once in `lib/palettes.ts`. Each fills the same roles:

| Role   | Used for                                                     |
| ------ | ------------------------------------------------------------ |
| ink    | Dark sections, text on light, the nav glass                  |
| field  | Hero and contact fields, primary actions                     |
| sky    | Light accent, hover on dark                                  |
| chalk  | Light sections, text on dark                                 |
| signal | State only: availability, focus rings, lens rim, cursor labels |

**The switcher is parked for now** (`site.features.palettes` in `data/site.ts`), so the site runs in Cobalt until brand colours are decided. With the flag on, visitors switch palettes from the nav, the mobile menu or the Contact section. The new palette grows out of the click point as a circle (a View Transition), and the portraits recolour in the same frame. The choice is remembered per browser, and a boot script applies it before first paint, so there's no flash of Cobalt. `scripts/check-palettes.mjs` checks every text pairing against WCAG AA.

## The portraits

`scripts/bake-portraits.mjs` trims the two painted portraits in `assets-source/`, then writes:

- a **greyscale luminance** texture (levels-stretched, with gamma), which the shader gradient-maps through the active palette at runtime
- the untouched **true-colour** painting
- a static **Cobalt** version, used without JS or WebGL and for the share card
- the contact card's **avatar** crop

`components/Portrait.tsx` shows the painting three ways:

- **tone**: the palette gradient map
- **code**: the painting redrawn from 16 characters, sorted by ink coverage, so each cell's glyph matches its brightness
- **color**: the original, dissolving in through noise

On top of all three, a lens follows the pointer and shows the original colours. The shader renders on demand, so an idle portrait costs nothing, and the canvas resolution is capped on phones.

## Sections

- **Hero.** The painting as a field of particles (`components/ParticlePortrait.tsx`). The points assemble from a scattered cloud on load, part around the cursor and show their true colour there, ripple outward on click, and drift apart like dust as you scroll. A role line decodes through what I design.
- **About.** A pinned, scroll-driven story in three chapters: Design, Code and Human. Each chapter swaps a giant outlined word, the copy, and the way the portrait is drawn (palette tone, a grid of code characters, the original painting). It snaps to the nearest chapter, and the rail on the right jumps between them.
- **Work.** Lumen and Atlas, with titles that roll letter by letter on hover (transform-only). Every project opens its own case study with a page transition in that project's colour.
- **Case studies** (`/work/lumen`, `/work/atlas`):
  - the brief and approach
  - an interactive user flow (it draws as you scroll, and each step explains itself; Atlas includes the "deny" branch)
  - a compare slider: Lumen's wireframe against the final screen, and Atlas in dark and light mode, driven by the real token values from Figma
  - the system in numbers, plus a component inventory with every variant
  - the live demo
  - a reflection, and a link to the next case
- **Process.** The design-file compare slider, then a pinned scene where one contact card evolves through the four steps: sticky-note questions, a redlined wireframe, code writing itself, then the finished, working card.
- **Toolkit.** A working keyboard with one tool per key. It plays a short tour by itself until someone interacts, and a grouped index below lists every tool at a glance.
- **Contact.** A composer that builds the email and opens it in your mail app. It also has copy-to-clipboard and live Amman time.

## Performance

These were measured on a phone-sized viewport with the CPU slowed 4×, in headless Chrome:

- the median frame takes 16.7 ms (60 fps) while scrolling the whole page, and 95% of frames finish within 33 ms
- Toolkit and Contact scroll with no slow frames at all

Choices that got it there:

- Native scrolling on touch screens.
- On phones, no section-wide colour fades and no letter-width animation (both force repaint or re-layout every frame).
- The compare slider moves by transforms only.
- Each section hydrates as its own Suspense boundary.
- three.js loads lazily and portraits render on demand.
- Covers are served as WebP, which decodes faster than AVIF on phones.

## Accessibility

- `prefers-reduced-motion` turns off Lenis, the intro, and every scrubbed or entrance animation. The page renders in its final state.
- Every interactive piece works from the keyboard: tabs, the slider (arrows, Shift, Home, End), the keyboard keys, radio groups, and the composer.
- The custom cursor only appears for fine pointers and stands aside over text fields.
- Figma's icon assets couldn't be downloaded from this build environment, so the demos use matching 24px stroke icons drawn in code.
