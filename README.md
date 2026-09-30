# Essa Adarbeh — portfolio v2

A ground-up redesign of [essa-adarbeh.vercel.app](https://essa-adarbeh.vercel.app), in its own codebase. The original portfolio is untouched.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint && npm run typecheck
npm run bake       # regenerate portrait textures (see below)
node scripts/trace-portrait.mjs   # redraw the portrait sketches
node scripts/make-icons.mjs       # favicon + home-screen icon from the mark
node scripts/check-palettes.mjs   # contrast check for every palette
```

It deploys to Vercel as-is: import the repo, no settings needed. Once the domain is final, set `NEXT_PUBLIC_SITE_URL` so share images resolve.

## Stack

- **Next.js 15** (App Router, one static page), **React 19**, **TypeScript**, **Tailwind CSS 4**
- **GSAP 3** with ScrollTrigger and SplitText for scroll-linked and text animation
- **Lenis** for smooth scrolling on desktop, driven from GSAP's ticker. Touch screens keep native scrolling.
- **Kalam** for everything written by hand; pen marks are hand-authored SVG paths drawn with stroke-dashoffset (`components/hand/Marks.tsx`)

## The mark

A pair of round glasses (`components/Lenses.tsx`, geometry in `lib/lenses.ts`): the left lens is drawn by hand, the right one is a perfect circle, design and build side by side. It's the nav sticker, the footer mark, the favicon (`app/icon.svg`, on a paper tile so it reads on light and dark tab bars), the home-screen icon (`app/apple-icon.png`) and the share image. `scripts/make-icons.mjs` regenerates the icons from the same geometry.

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

`scripts/trace-portrait.mjs` then turns each painting into a drawing: the silhouette and light-and-shadow contours as SVG paths (`data/sketch-*.json`, the lines the pen follows), and an ink sketch (`public/portraits/*-ink.webp`) made with an XDoG line filter plus pencil hatching in the darkest shadows. The hero draws and paints the first portrait over these; About uses the second portrait on the desk. The greyscale and Cobalt versions are kept for the parked palette system and the share card.

## Sections

- **Nav.** Taped to the top of the page: the mark as a round sticker (its hand-drawn lens draws itself on load), your name on a paper label, the links handwritten on a strip of masking tape with a pen squiggle under the section you're in, and "Available for work" as a label-maker strip. None of it re-themes: tape and labels read on paper and on the dark sections alike. On phones the menu is a sheet of paper.
- **Hero.** A notebook page. The sentence is typeset, then a hand marks it up: the pen circles "design", a highlighter runs under "& build", and a margin note is written with an arrow. Then a pen draws Essa in one continuous line, the pencil sketch fills in along the pen's paths, and paint washes in from the face outward with a ragged watercolour edge (`components/hand/SketchPortrait.tsx`, all SVG). Hovering lifts the paint under the pointer so the sketch shows through; on phones a tap swaps sketch and painting. Scrolling away drains the paint back out. Visitors can also draw on the page with a ballpoint (`components/hand/Doodle.tsx`): strokes thin out when fast and pool when slow.
- **About.** Essa again, turned around this time: the back-view painting is drawn and painted the same way as the hero once the desk scrolls into view. Around the figure is a desk of objects you can pick up and move: an index-card bio, sticky notes (principles from the old site), a hand-drawn clock showing Amman's actual time, a label-maker strip, and a to-do list whose last item, "your project?", links to Contact. On phones the desk becomes a row of cards you swipe through.
- **Work.** The notebook page tears off here (`components/hand/TornEdge.tsx`) and the screens begin. Lumen and Atlas have titles that roll letter by letter on hover (transform-only), and a note scribbled over each cover in the project's own colour. Every project opens its own case study with a page transition in that project's colour.
- **Case studies** (`/work/lumen`, `/work/atlas`) tell the same paper-and-screen story as the home page:
  - the project on its own screen, with a taped index card (role, scope, tools) and the cover note from the home page
  - the page tears into a notebook for the thinking: the brief, the approach as sticky notes, and an interactive user flow (it draws as you scroll, and each step explains itself; Atlas includes the "deny" branch)
  - back on screen for the build: a compare slider (Lumen's wireframe against the final screen, Atlas in dark and light mode, driven by the real token values from Figma), the system in numbers plus a component inventory with every variant, and the live demo
  - a signed note on paper to close, then the next case
  - every section heading has a note scribbled beside it, in the project's colour
- **Process.** Back on paper. The pen circles "design" and underlines "code" in the heading, the same way it marks up the hero. Then comes the design-file compare slider, then a pinned scene where one contact card evolves through the four steps: sticky-note questions, a redlined wireframe, code writing itself, then the finished, working card. The pen circles the step you're on and ticks off the ones behind you.
- **Toolkit.** A working keyboard with one tool per key, with a note scribbled on it: it plays a short tour by itself until someone takes over. A grouped index below lists every tool at a glance.
- **Contact.** A letter. The composer starts "Hi Essa,", the way the email will, and the left column is signed by hand with a "Replies within a day" stamp. It builds the email and opens it in your mail app, and also has copy-to-clipboard and live Amman time.

## Performance

Measured on a phone-sized viewport with the CPU slowed 4×, in headless Chrome (software rendering, which exaggerates paint costs):

- first contentful paint at 0.6–1.0 s, total blocking time around 200 ms
- the median frame takes 16.7 ms (60 fps) while scrolling the whole page; roughly 9–12% of frames take longer than 33 ms, mostly in About (the desk landing) and the pinned Process scene

Choices that got it there:

- Native scrolling on touch screens.
- On phones, the portraits skip the SVG masks and displacement filters: the pen still draws the line, then the sketch and the paint fade in as plain images (compositor-only opacity).
- The paper texture is left off the pinned Process scene on phones, where a pinned layer with a tiled background repaints while it scrolls.
- On phones, no section-wide colour fades and no letter-width animation (both force repaint or re-layout every frame).
- The compare slider moves by transforms only.
- Each section hydrates as its own Suspense boundary.
- No WebGL: the hand-made layer is SVG and CSS, and the doodle canvas only draws while you draw.
- Covers are served as WebP, which decodes faster than AVIF on phones.

## Accessibility

- `prefers-reduced-motion` turns off Lenis, the intro, and every scrubbed or entrance animation. The page renders in its final state.
- Every interactive piece works from the keyboard: tabs, the slider (arrows, Shift, Home, End), the keyboard keys, radio groups, and the composer.
- The custom cursor only appears for fine pointers and stands aside over text fields.
- Figma's icon assets couldn't be downloaded from this build environment, so the demos use matching 24px stroke icons drawn in code.
