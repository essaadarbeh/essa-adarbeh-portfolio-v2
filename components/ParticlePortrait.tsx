"use client";

import { useEffect, useRef } from "react";
import type * as THREE_NS from "three";
import { gsap, onIntroDone } from "@/lib/gsap";
import { rampBytes, PALETTE_EVENT, type Palette } from "@/lib/palettes";
import { currentPalette } from "@/lib/palette-client";

// The painting as a field of points, one per few pixels. Each point samples
// the greyscale texture for its size and palette colour, and the original
// painting for the colour it shows under the cursor.
//
//   assemble  points fly in from a scattered cloud below and settle
//   hover     points part around the cursor and show their true colour
//   click     a ripple runs outward through the field
//   scroll    the portrait comes apart upward, like dust
const vertex = /* glsl */ `
  attribute vec3 aRand;
  uniform sampler2D uLuma;
  uniform sampler2D uColor;
  uniform sampler2D uRamp;
  uniform vec4 uRect;       // image rect in clip space: x0, y0, w, h
  uniform vec2 uMouse;      // clip space
  uniform float uAspect;    // canvas width / height
  uniform float uHover;
  uniform float uAssemble;
  uniform float uScatter;
  uniform float uTime;
  uniform float uSize;
  uniform vec3 uRipple;     // x, y (clip space), age in seconds
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 uv = position.xy;
    vec4 L = texture2D(uLuma, uv);
    vec4 C = texture2D(uColor, uv);
    float on = step(0.35, L.a);
    vec2 home = uRect.xy + uv * uRect.zw;

    // assemble: staggered by a per-point random so the figure fills in
    float a = clamp(uAssemble * 1.4 - aRand.z * 0.4, 0.0, 1.0);
    a = 1.0 - pow(1.0 - a, 3.0);
    vec2 from = home + (aRand.xy - 0.5) * 2.4 + vec2(0.0, -1.3);
    vec2 p = mix(from, home, a);

    // cursor: push points away, with a little swirl
    vec2 d = (p - uMouse) * vec2(uAspect, 1.0);
    float dist = length(d);
    vec2 dir = d / max(dist, 1e-4);
    dir.x /= uAspect;
    float f = smoothstep(0.3, 0.0, dist) * uHover;
    p += dir * f * 0.085 + vec2(-dir.y, dir.x) * f * 0.025;
    float lens = smoothstep(0.24, 0.1, dist) * uHover;

    // ripple from the last click
    float age = uRipple.z;
    if (age < 1.6) {
      vec2 rd = (p - uRipple.xy) * vec2(uAspect, 1.0);
      float r = length(rd);
      float band = exp(-pow((r - age * 1.3) * 11.0, 2.0)) * (1.0 - age / 1.6);
      vec2 rdir = rd / max(r, 1e-4);
      rdir.x /= uAspect;
      p += rdir * band * 0.06;
      lens = max(lens, band);
    }

    // scroll: drift up and apart
    float s = uScatter * uScatter;
    p += vec2((aRand.x - 0.5) * 0.9, 0.3 + aRand.y * 1.4) * s;

    // idle: a barely-there breathing so the field feels alive
    p += vec2(sin(uTime * 0.8 + aRand.x * 6.283), cos(uTime * 0.7 + aRand.y * 6.283)) * 0.0016;

    gl_Position = vec4(p, 0.0, 1.0);
    vec3 tone = texture2D(uRamp, vec2(L.r, 0.5)).rgb;
    vColor = mix(tone, C.rgb, lens);
    vAlpha = on * (1.0 - uScatter) * smoothstep(0.0, 0.2, a);
    gl_PointSize = on * uSize * (0.85 + L.r * 0.55 + lens * 0.3);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5);
    if (r > 0.5) discard;
    float a = vAlpha * smoothstep(0.5, 0.32, r);
    gl_FragColor = vec4(vColor * a, a);
  }
`;

type Props = {
  luma: string;
  color: string;
  width: number;
  height: number;
  /** The element whose box the painting fills (also carries the fallback). */
  frame: React.RefObject<HTMLElement | null>;
  /** The element that receives pointer input and defines the canvas. */
  stage: React.RefObject<HTMLElement | null>;
};

export default function ParticlePortrait({ luma, color, width, height, frame, stage }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const host = stage.current!;
    const box = frame.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(pointer: coarse)").matches;
    let disposed = false;
    let teardown = () => {};
    const fail = () => {
      if (!disposed) box.dataset.fallback = "true";
    };

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
          renderer.dispose();
          return;
        }

        // one point every few image pixels: denser on desktop
        const step = coarse || innerWidth < 768 ? 7 : 4.5;
        const cols = Math.floor(width / step);
        const rows = Math.floor(height / step);
        const count = cols * rows;
        const pos = new Float32Array(count * 3);
        const rnd = new Float32Array(count * 3);
        for (let y = 0, i = 0; y < rows; y++) {
          for (let x = 0; x < cols; x++, i++) {
            // a hair of jitter breaks up the grid
            pos[i * 3] = (x + 0.5 + (Math.random() - 0.5) * 0.6) / cols;
            pos[i * 3 + 1] = (y + 0.5 + (Math.random() - 0.5) * 0.6) / rows;
            rnd[i * 3] = Math.random();
            rnd[i * 3 + 1] = Math.random();
            rnd[i * 3 + 2] = Math.random();
          }
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
        geometry.setAttribute("aRand", new THREE.BufferAttribute(rnd, 3));

        const ramp = new THREE.DataTexture(rampBytes(currentPalette()), 256, 1, THREE.RGBAFormat);
        ramp.minFilter = ramp.magFilter = THREE.LinearFilter;
        ramp.needsUpdate = true;

        const uniforms = {
          uLuma: { value: lumaTex },
          uColor: { value: colorTex },
          uRamp: { value: ramp },
          uRect: { value: new THREE.Vector4(-0.5, -1, 1, 2) },
          uMouse: { value: new THREE.Vector2(9, 9) },
          uAspect: { value: 1 },
          uHover: { value: 0 },
          uAssemble: { value: reduced ? 1 : 0 },
          uScatter: { value: 0 },
          uTime: { value: 0 },
          uSize: { value: 3 },
          uRipple: { value: new THREE.Vector3(0, 0, 9) },
        };
        const material = new THREE.ShaderMaterial({
          vertexShader: vertex,
          fragmentShader: fragment,
          uniforms,
          transparent: true,
          premultipliedAlpha: true,
          depthTest: false,
          depthWrite: false,
        });
        const points = new THREE.Points(geometry, material);
        points.frustumCulled = false;
        const scene = new THREE.Scene();
        scene.add(points);
        const camera = new THREE.Camera();

        // ── layout: map the frame's box into the canvas's clip space ──────
        let cw = 1;
        let ch = 1;
        const layout = () => {
          const c = host.getBoundingClientRect();
          const b = box.getBoundingClientRect();
          cw = c.width;
          ch = c.height;
          renderer.setSize(cw, ch, false);
          const x0 = ((b.left - c.left) / cw) * 2 - 1;
          const y0 = 1 - ((b.bottom - c.top) / ch) * 2;
          uniforms.uRect.value.set(x0, y0, (b.width / cw) * 2, (b.height / ch) * 2);
          uniforms.uAspect.value = cw / ch;
          uniforms.uSize.value = (b.height / rows) * dpr * 1.45;
        };
        const ro = new ResizeObserver(() => {
          layout();
          wake(50);
        });
        ro.observe(host);
        layout();

        // ── loop: continuous while visible on desktop (the field breathes),
        //    on demand on phones ────────────────────────────────────────────
        let visible = true;
        let raf = 0;
        let awakeUntil = 0;
        const mouse = new THREE.Vector2(9, 9);
        const hover = { v: 0 };
        const t0 = performance.now();
        let last = t0;
        const frameFn = () => {
          raf = 0;
          const now = performance.now();
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          const r = host.getBoundingClientRect();
          uniforms.uScatter.value = reduced ? 0 : Math.min(1, Math.max(0, -r.top / (r.height * 0.9)));
          uniforms.uMouse.value.lerp(mouse, 0.2);
          uniforms.uHover.value = hover.v;
          uniforms.uTime.value = (now - t0) / 1000;
          uniforms.uRipple.value.z += dt;
          renderer.render(scene, camera);
          const busy = (!coarse && !reduced) || now < awakeUntil || hover.v > 0.001 || uniforms.uRipple.value.z < 1.6;
          if (visible && busy) raf = requestAnimationFrame(frameFn);
        };
        const wake = (ms = 0) => {
          awakeUntil = Math.max(awakeUntil, performance.now() + ms);
          if (!raf && visible) raf = requestAnimationFrame(frameFn);
        };
        const io = new IntersectionObserver(([e]) => {
          visible = e.isIntersecting;
          if (visible) wake(100);
        });
        io.observe(host);

        // ── input ─────────────────────────────────────────────────────────
        const toClip = (e: PointerEvent) => {
          const c = host.getBoundingClientRect();
          mouse.set(((e.clientX - c.left) / c.width) * 2 - 1, 1 - ((e.clientY - c.top) / c.height) * 2);
        };
        const move = (e: PointerEvent) => {
          toClip(e);
          if (hover.v < 1 && !gsap.isTweening(hover)) {
            uniforms.uMouse.value.copy(mouse);
            gsap.to(hover, { v: 1, duration: 0.6, ease: "power2.out" });
          }
          wake(400);
        };
        const leave = () => {
          gsap.to(hover, { v: 0, duration: 0.8, ease: "power2.out", overwrite: true });
          wake(900);
        };
        const down = (e: PointerEvent) => {
          toClip(e);
          uniforms.uRipple.value.set(mouse.x, mouse.y, 0);
          wake(1700);
        };
        const onScroll = () => wake(120);
        host.addEventListener("pointermove", move);
        host.addEventListener("pointerleave", leave);
        const up = (e: PointerEvent) => e.pointerType === "touch" && leave();
        host.addEventListener("pointerup", up);
        host.addEventListener("pointerdown", down);
        window.addEventListener("scroll", onScroll, { passive: true });

        const onPalette = (e: Event) => {
          ramp.image.data!.set(rampBytes((e as CustomEvent<Palette>).detail));
          ramp.needsUpdate = true;
          wake(50);
        };
        window.addEventListener(PALETTE_EVENT, onPalette);

        canvas.style.opacity = "1";
        box.dataset.ready = "true";
        let cancelIntro = () => {};
        if (!reduced) {
          cancelIntro = onIntroDone(() => {
            gsap.to(uniforms.uAssemble, { value: 1, duration: 2.8, ease: "power2.out" });
            wake(2900);
          });
        }
        wake(100);

        teardown = () => {
          cancelIntro();
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          host.removeEventListener("pointermove", move);
          host.removeEventListener("pointerleave", leave);
          host.removeEventListener("pointerdown", down);
          host.removeEventListener("pointerup", up);
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener(PALETTE_EVENT, onPalette);
          gsap.killTweensOf([hover, uniforms.uAssemble]);
          [lumaTex, colorTex, ramp].forEach((t) => t.dispose());
          geometry.dispose();
          material.dispose();
          renderer.dispose();
        };
      })
      .catch(fail);

    return () => {
      disposed = true;
      teardown();
    };
  }, [luma, color, width, height, frame, stage]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 h-full w-full opacity-0 transition-opacity duration-500"
    />
  );
}
