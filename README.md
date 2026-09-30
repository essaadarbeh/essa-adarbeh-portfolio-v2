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

Visitors switch palettes from the nav, the mobile menu or the Contact section, or by clicking the hero portrait. The new palette grows out of the click point as a circle (a View Transition), and the portraits recolour in the same frame. The choice is remembered per browser, and a boot script applies it before first paint, so there's no flash of Cobalt. `scripts/check-palettes.mjs` checks every text pairing against WCAG AA.

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

- **Hero.** The name sits behind the portrait. Letters rise and stretch on load, while the portrait develops up from the floor.
- **About.** An interactive profile screen with three views: Designer, Developer and Person. Each view changes the portrait mode, the headline's letter width, and the text, which decodes into place.
- **Work.** Lumen and Atlas. The section takes on each project's colours as you reach it, covers open and tilt, and each project includes a live piece rebuilt from its Figma file:
  - **Lumen token playground.** Change the brand colour, radius or density tokens and every stat card updates. Switch the date range to morph the sparklines, and hover one to read values.
  - **Atlas research run.** A plan executes with tool calls, then Atlas stops and asks permission. Approving or denying changes how the run ends. Replay restarts it.
- **Process.** A draggable comparison of one contact card as a design file with redlines and as working UI. Picking a project type there and pressing the button pre-fills the Contact composer.
- **Toolkit.** A working keyboard with one tool per key. Click, tap, or type on a real keyboard. The bottom row groups tools by kind, and Space shuffles.
- **Contact.** A composer that builds the email (project type, timeline, note) and opens it in your mail app. It also has copy-to-clipboard, live Amman time and the palette switcher.

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
