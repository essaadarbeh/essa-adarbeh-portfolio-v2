"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";
import { gsap, onIntroDone } from "@/lib/gsap";
import { hexToRgb, rampBytes, PALETTE_EVENT, type Palette } from "@/lib/palettes";
import { currentPalette } from "@/lib/palette-client";

export type PortraitMode = "tone" | "code" | "color";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// One greyscale painting, three ways to see it:
//   tone   luminance gradient-mapped through the active palette (uRamp)
//   code   the same luminance redrawn as a grid of glyphs, densest where brightest
//   color  the untouched painting
// uCode / uTrue blend between them: code flips in cell by cell, colour
// dissolves in through noise. The lens always shows the original colours.
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uLuma;
  uniform sampler2D uColor;
  uniform sampler2D uRamp;
  uniform sampler2D uGlyphs;
  uniform float uGlyphCount;
  uniform float uCell;
  uniform vec2 uRes;
  uniform vec3 uSignal;
  uniform vec2 uMouse;
  uniform float uRadius;
  uniform float uAspect;
  uniform float uReveal;
  uniform float uTime;
  uniform float uVelocity;
  uniform float uCode;
  uniform float uTrue;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec2 uv = vUv;
    uv.x += sin(uv.y * 9.0 + uTime * 2.0) * uVelocity * 0.006;

    // tone: palette gradient map (premultiplied)
    vec4 L = texture2D(uLuma, uv);
    vec4 tone = vec4(texture2D(uRamp, vec2(L.r, 0.5)).rgb * L.a, L.a);

    // color: the original, dissolving in through noise
    vec4 C = texture2D(uColor, uv);
    vec4 color = vec4(C.rgb * C.a, C.a);
    float n = noise(uv * 5.0);
    float trueMix = smoothstep(n - 0.08, n + 0.08, uTrue * 1.2 - 0.1);
    vec4 base = mix(tone, color, trueMix);

    // code: one glyph per cell, picked by the cell's luminance
    if (uCode > 0.001) {
      vec2 px = vUv * uRes;
      vec2 cell = floor(px / uCell);
      vec4 Lc = texture2D(uLuma, (cell + 0.5) * uCell / uRes);
      float lum = pow(Lc.r, 0.55); // lift the shadows so the suit still reads
      float g = floor(clamp(1.0 - lum, 0.0, 0.999) * uGlyphCount);
      vec2 inCell = fract(px / uCell);
      float glyph = texture2D(uGlyphs, vec2((g + inCell.x) / uGlyphCount, inCell.y)).r;
      vec3 ink = texture2D(uRamp, vec2(0.6 + lum * 0.4, 0.5)).rgb;
      float a = glyph * Lc.a;
      // glyphs over a faint ghost of the painting, so the silhouette holds
      vec4 code = vec4(ink * a, a) + tone * 0.16 * (1.0 - a);
      float flip = step(hash(cell), uCode);
      base = mix(base, code, flip);
    }

    // lens
    vec2 d = uv - uMouse;
    d.x *= uAspect;
    float dist = length(d);
    float wobble = (noise(uv * 7.0 + uTime * 0.35) - 0.5) * 0.035 * step(0.001, uRadius);
    float r = uRadius + wobble;
    float lens = 1.0 - smoothstep(r - 0.012, r + 0.012, dist);
    float rim = smoothstep(r - 0.03, r - 0.004, dist) * (1.0 - smoothstep(r - 0.004, r + 0.014, dist));
    rim *= smoothstep(0.0, 0.06, uRadius);
    vec4 lensC = texture2D(uColor, uMouse + (uv - uMouse) * (1.0 - 0.1 * lens));
    vec4 c = mix(base, vec4(lensC.rgb * lensC.a, lensC.a), lens);
    c.rgb = mix(c.rgb, uSignal * c.a, rim * 0.85);

    // develop: a ragged line rising from the bottom edge
    float edge = (1.0 - vUv.y) + (noise(vUv * vec2(6.0, 3.0) + 3.0) - 0.5) * 0.25;
    float shown = 1.0 - smoothstep(uReveal * 1.3 - 0.12, uReveal * 1.3, edge);
    gl_FragColor = c * shown;
  }
`;

/** Glyphs sorted by ink coverage, drawn into one strip texture. */
function glyphAtlas(THREE: typeof THREE_NS) {
  const chars = [" ", ".", ":", "-", "=", "+", "/", "<", ">", "*", "{", "}", "[", "#", "%", "@"];
  const S = 48;
  const probe = document.createElement("canvas");
  probe.width = probe.height = S;
  const pc = probe.getContext("2d", { willReadFrequently: true })!;
  const font = `700 ${Math.round(S * 0.9)}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
  const coverage = (ch: string) => {
    pc.clearRect(0, 0, S, S);
    pc.fillStyle = "#fff";
    pc.font = font;
    pc.textAlign = "center";
    pc.textBaseline = "middle";
    pc.fillText(ch, S / 2, S / 2 + 2);
    const px = pc.getImageData(0, 0, S, S).data;
    let sum = 0;
    for (let i = 0; i < px.length; i += 4) sum += px[i];
    return sum;
  };
  const sorted = chars.map((c) => [c, coverage(c)] as const).sort((a, b) => b[1] - a[1]);

  const canvas = document.createElement("canvas");
  canvas.width = S * sorted.length;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, S);
  ctx.fillStyle = "#fff";
  ctx.font = font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  sorted.forEach(([c], i) => ctx.fillText(c, i * S + S / 2, S / 2 + 2));

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return { tex, count: sorted.length };
}

type Props = {
  luma: string;
  color: string;
  /** Static Cobalt image: first paint without JS, and the no-WebGL fallback. */
  tone: string;
  width: number;
  height: number;
  alt: string;
  mode?: PortraitMode;
  lens?: boolean;
  /** Develop the image in from the floor once the hero intro finishes. */
  develop?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

type Api = { setMode: (m: PortraitMode) => void };

export default function Portrait({
  luma,
  color,
  tone,
  width,
  height,
  alt,
  mode = "tone",
  lens = true,
  develop,
  priority,
  sizes = "50vw",
  className,
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const api = useRef<Api | null>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
    api.current?.setMode(mode);
  }, [mode]);

  useEffect(() => {
    const el = wrap.current!;
    const canvas = canvasRef.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(pointer: coarse)").matches;
    let disposed = false;
    let teardown = () => {};

    const fail = () => {
      if (!disposed) el.dataset.fallback = "true";
    };

    // three.js is only fetched once a portrait is needed, never in the main
    // bundle. Off-screen portraits wait until they're about a screen away.
    const init = () =>
      import("three")
        .then(async (THREE) => {
          if (disposed) return;
          let renderer: THREE_NS.WebGLRenderer;
          try {
            renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true });
          } catch {
            return fail();
          }
          const dpr = Math.min(window.devicePixelRatio, coarse ? 1.5 : 2);
          renderer.setPixelRatio(dpr);
          renderer.setClearColor(0x000000, 0);

          const loader = new THREE.TextureLoader();
          const load = (src: string) =>
            loader.loadAsync(src).then((t) => {
              t.colorSpace = THREE.NoColorSpace;
              t.minFilter = THREE.LinearFilter;
              t.generateMipmaps = false;
              return t;
            });
          let lumaTex: THREE_NS.Texture, colorTex: THREE_NS.Texture;
          try {
            [lumaTex, colorTex] = await Promise.all([load(luma), load(color)]);
          } catch {
            renderer.dispose();
            return fail();
          }
          if (disposed) {
            lumaTex.dispose();
            colorTex.dispose();
            renderer.dispose();
            return;
          }

          const palette = currentPalette();
          const ramp = new THREE.DataTexture(rampBytes(palette), 256, 1, THREE.RGBAFormat);
          ramp.minFilter = ramp.magFilter = THREE.LinearFilter;
          ramp.needsUpdate = true;
          const glyphs = glyphAtlas(THREE);
          const signal = (p: Palette) => new THREE.Vector3(...hexToRgb(p.signal).map((v) => v / 255));

          const uniforms = {
            uLuma: { value: lumaTex },
            uColor: { value: colorTex },
            uRamp: { value: ramp },
            uGlyphs: { value: glyphs.tex },
            uGlyphCount: { value: glyphs.count },
            uCell: { value: 12 * dpr },
            uRes: { value: new THREE.Vector2(1, 1) },
            uSignal: { value: signal(palette) },
            uMouse: { value: new THREE.Vector2(0.5, 0.6) },
            uRadius: { value: 0 },
            uAspect: { value: width / height },
            uReveal: { value: develop && !reduced ? 0 : 1 },
            uTime: { value: 0 },
            uVelocity: { value: 0 },
            uCode: { value: modeRef.current === "code" ? 1 : 0 },
            uTrue: { value: modeRef.current === "color" ? 1 : 0 },
          };
          const material = new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment,
            uniforms,
            transparent: true,
            blending: THREE.NoBlending,
            depthTest: false,
          });
          const geometry = new THREE.PlaneGeometry(2, 2);
          const scene = new THREE.Scene();
          scene.add(new THREE.Mesh(geometry, material));
          const camera = new THREE.Camera();

          // ── render on demand ────────────────────────────────────────────
          // Nothing draws while the portrait is idle. Anything that changes a
          // uniform calls wake(ms) to keep frames coming for that long.
          // measured directly: an IntersectionObserver can misreport inside a
          // pinned (position: fixed) section
          const onScreen = () => {
            const r = el.getBoundingClientRect();
            return r.bottom > -120 && r.top < innerHeight + 120 && r.width > 0;
          };
          let raf = 0;
          let awakeUntil = 0;
          let velocity = 0;
          let lastY = window.scrollY;
          const target = new THREE.Vector2(0.5, 0.6);
          const radius = { v: 0 };

          const draw = () => {
            uniforms.uTime.value = performance.now() / 1000;
            renderer.render(scene, camera);
          };
          const frame = () => {
            raf = 0;
            const y = window.scrollY;
            velocity += (Math.max(-40, Math.min(40, y - lastY)) - velocity) * 0.1;
            lastY = y;
            uniforms.uVelocity.value = reduced || coarse ? 0 : velocity;
            uniforms.uMouse.value.lerp(target, 0.18);
            uniforms.uRadius.value = radius.v;
            const visible = onScreen();
            if (visible) draw();
            const busy =
              performance.now() < awakeUntil ||
              radius.v > 0.001 ||
              Math.abs(velocity) > 0.05 ||
              uniforms.uMouse.value.distanceToSquared(target) > 1e-6;
            if (busy && visible) raf = requestAnimationFrame(frame);
          };
          const wake = (ms = 0) => {
            awakeUntil = Math.max(awakeUntil, performance.now() + ms);
            if (!raf) raf = requestAnimationFrame(frame);
          };

          const resize = () => {
            const r = el.getBoundingClientRect();
            renderer.setSize(r.width, r.height, false);
            uniforms.uRes.value.set(r.width * dpr, r.height * dpr);
            uniforms.uCell.value = (r.width < 420 ? 9 : 12) * dpr;
            if (onScreen()) draw();
          };
          const ro = new ResizeObserver(resize);
          ro.observe(el);
          resize();

          const io = new IntersectionObserver(
            ([e]) => {
              if (e.isIntersecting) wake(100);
            },
            { rootMargin: "120px" },
          );
          io.observe(el);

          // palette: rebuild the ramp and draw now, inside the view transition
          const onPalette = (e: Event) => {
            const p = (e as CustomEvent<Palette>).detail;
            ramp.image.data!.set(rampBytes(p));
            ramp.needsUpdate = true;
            uniforms.uSignal.value = signal(p);
            if (onScreen()) draw();
          };
          window.addEventListener(PALETTE_EVENT, onPalette);

          // scroll bends the image on desktop only; phones skip those frames
          const onScroll = () => wake(0);
          if (!coarse && !reduced) window.addEventListener("scroll", onScroll, { passive: true });

          // lens
          const lensSize = () => (el.clientWidth < 420 ? 0.26 : 0.2);
          const toUv = (e: PointerEvent) => {
            const r = el.getBoundingClientRect();
            target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
            wake(0);
          };
          const enter = (e: PointerEvent) => {
            toUv(e);
            uniforms.uMouse.value.copy(target);
            gsap.to(radius, { v: lensSize(), duration: 0.9, ease: "elastic.out(1, 0.55)", overwrite: true });
            wake(900);
          };
          const leave = () => {
            gsap.to(radius, { v: 0, duration: 0.5, ease: "power3.out", overwrite: true });
            wake(500);
          };
          if (lens) {
            el.addEventListener("pointerenter", enter);
            el.addEventListener("pointermove", toUv);
            el.addEventListener("pointerleave", leave);
            el.addEventListener("pointercancel", leave);
          }

          api.current = {
            setMode(m) {
              const dur = reduced ? 0 : 1.1;
              gsap.to(uniforms.uCode, {
                value: m === "code" ? 1 : 0,
                duration: dur,
                ease: "power2.inOut",
                overwrite: true,
              });
              gsap.to(uniforms.uTrue, {
                value: m === "color" ? 1 : 0,
                duration: dur,
                ease: "power2.inOut",
                overwrite: true,
              });
              wake(dur * 1000 + 50);
            },
          };

          canvas.style.opacity = "1";
          el.dataset.ready = "true";
          let cancelIntro = () => {};
          if (develop && !reduced) {
            cancelIntro = onIntroDone(() => {
              gsap.to(uniforms.uReveal, { value: 1, duration: 2.2, ease: "power2.inOut" });
              wake(2300);
            });
          }
          draw();

          teardown = () => {
            cancelIntro();
            cancelAnimationFrame(raf);
            ro.disconnect();
            io.disconnect();
            window.removeEventListener(PALETTE_EVENT, onPalette);
            window.removeEventListener("scroll", onScroll);
            el.removeEventListener("pointerenter", enter);
            el.removeEventListener("pointermove", toUv);
            el.removeEventListener("pointerleave", leave);
            el.removeEventListener("pointercancel", leave);
            gsap.killTweensOf([radius, uniforms.uCode, uniforms.uTrue, uniforms.uReveal]);
            [lumaTex, colorTex, ramp, glyphs.tex].forEach((t) => t.dispose());
            material.dispose();
            geometry.dispose();
            renderer.dispose();
            api.current = null;
          };
        })
        .catch(fail);

    // Off-screen portraits start once the browser is idle after load, so they
    // never compete with the first paint. (Not an IntersectionObserver: inside
    // a pinned section it can report the portrait as hidden while it's shown.)
    let idle = 0;
    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1200));
    const cic = window.cancelIdleCallback ?? window.clearTimeout;
    if (priority) init();
    else idle = ric(() => init(), { timeout: 2500 });

    return () => {
      disposed = true;
      cic(idle);
      teardown();
    };
  }, [luma, color, width, height, develop, lens, priority]);

  return (
    <div
      ref={wrap}
      className={`portrait relative select-none ${className ?? ""}`}
      style={{ aspectRatio: `${width} / ${height}`, touchAction: "pan-y" }}
    >
      {/* Seen without JS or without WebGL (see .portrait rules in globals.css).
          With JS it stays hidden, so a non-default palette never flashes Cobalt. */}
      <Image src={tone} alt={alt} fill priority={priority} sizes={sizes} className="portrait-fallback object-contain" />
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500"
      />
    </div>
  );
}
