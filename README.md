# Essa Adarbeh — portfolio v2

A ground-up redesign of [essa-adarbeh.vercel.app](https://essa-adarbeh.vercel.app). This is a separate codebase; the original portfolio is untouched.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run lint && npm run typecheck
npm run bake       # regenerate the recoloured portraits (see below)
```

Deploys to Vercel as-is (import the repo, no settings needed). Set `NEXT_PUBLIC_SITE_URL` once the domain is final so share images resolve.

## Stack

- **Next.js 15** (App Router, static export of one page), **React 19**, **TypeScript**, **Tailwind CSS 4**
- **GSAP 3** with ScrollTrigger and SplitText for every scroll-linked and text animation
- **Lenis** for smooth scrolling, driven from GSAP's ticker so both share one clock
- **three.js** for the portrait lens shader (a single full-screen plane, no scene graph)

## Design system

| Token    | Hex       | Used for                                                     |
| -------- | --------- | ------------------------------------------------------------ |
| Ink      | `#0B1238` | Dark sections, body text on light, the nav glass             |
| Cobalt   | `#2B3BFF` | Hero and contact fields, primary actions                     |
| Sky      | `#A9B8FF` | Highlights, hover state on dark                              |
| Chalk    | `#EEF0F6` | Light sections, text on dark                                 |
| Marigold | `#FFC24B` | State only: availability, focus rings, the lens rim, cursor  |

The palette is pulled from the portrait itself: the suit's navy, the field it stands on, its highlights, and one warm signal.

**Type.** Anybody (display) and Onest (text). Anybody's width axis, 50–150, is the motion material of the whole site: the name stretches from narrow to wide on load and compresses as you scroll away, project titles widen letter by letter on hover, and the contact headline stretches in as it arrives. Components animate a `--wdth` custom property.

## The portraits

`scripts/bake-portraits.mjs` recolours the two painted portraits in `assets-source/`, the same way the old site baked its violet duotone. It:

1. trims the transparent padding,
2. stretches the luminance between the 1st and 99th percentile,
3. remaps it through a cobalt ramp (ink → cobalt → sky → chalk), and
4. writes a true-colour twin at identical dimensions.

`components/PortraitLens.tsx` puts both textures on a WebGL plane. Outside the lens you see the cobalt version. Inside, the original painting shows through, slightly magnified, with a marigold rim. The hero version "develops" up from the floor on first load. Touch works too: press and drag. Without WebGL, the static cobalt image stays in place.

To retune the colour, edit `RAMP` in the script and run `npm run bake`.

## Sections

- **Hero.** The name sits behind the portrait lens. This is the site's one orchestrated load moment.
- **About.** A statement that reads itself in word by word as you scroll, with the second portrait under the same lens.
- **Work.** Lumen and Atlas. The section's background takes on each project's own colour while it's on screen. Covers open from an inset window and tilt toward the pointer.
- **Process.** A draggable comparison of the same contact card as a design file with redlines and as working UI (try the segmented control). It's keyboard accessible as a slider. Below it, four steps on a rail that fills as you scroll.
- **Toolkit.** Four sentences instead of a logo wall.
- **Contact.** Copy-to-clipboard email with confirmation, live Amman time, and socials.

## Accessibility and motion

- `prefers-reduced-motion` turns off Lenis, the intro, and every scrubbed or entrance animation. Content renders in its final state.
- The custom cursor only appears for fine pointers. Focus rings are marigold with an ink halo, so they show on every surface.
- The compare handle is a `role="slider"` with arrow, Shift+arrow, Home and End support.
