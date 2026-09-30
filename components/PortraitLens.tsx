"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap, onIntroDone } from "@/lib/gsap";

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

// Two textures, one lens. Outside the lens: the baked cobalt tritone.
// Inside: the untouched painting, slightly magnified, with a marigold rim.
// uReveal develops the tone image in from the floor up on first load.
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTone;
  uniform sampler2D uColor;
  uniform vec2 uMouse;
  uniform float uRadius;
  uniform float uAspect;
  uniform float uReveal;
  uniform float uTime;
  uniform float uVelocity;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec2 uv = vUv;
    // scroll velocity bends the image a touch, like a print on a moving sheet
    uv.x += sin(uv.y * 9.0 + uTime * 2.0) * uVelocity * 0.006;

    vec2 d = uv - uMouse;
    d.x *= uAspect;
    float dist = length(d);
    float wobble = (noise(uv * 7.0 + uTime * 0.35) - 0.5) * 0.035 * step(0.001, uRadius);
    float r = uRadius + wobble;
    float lens = 1.0 - smoothstep(r - 0.012, r + 0.012, dist);
    float rim = smoothstep(r - 0.03, r - 0.004, dist) * (1.0 - smoothstep(r - 0.004, r + 0.014, dist));
    rim *= smoothstep(0.0, 0.06, uRadius); // no stray rim dot while the lens is closed

    vec2 lensUv = uMouse + (uv - uMouse) * (1.0 - 0.1 * lens);
    vec4 tone = texture2D(uTone, uv);
    vec4 color = texture2D(uColor, lensUv);
    vec4 c = mix(tone, color, lens);
    c.rgb = mix(c.rgb, vec3(1.0, 0.76, 0.29), rim * 0.85);

    // develop: a ragged line rising from the bottom edge
    float edge = (1.0 - vUv.y) + (noise(vUv * vec2(6.0, 3.0) + 3.0) - 0.5) * 0.25;
    float shown = 1.0 - smoothstep(uReveal * 1.3 - 0.12, uReveal * 1.3, edge);
    float a = c.a * shown;
    gl_FragColor = vec4(c.rgb * a, a);
  }
`;

type Props = {
  tone: string;
  color: string;
  width: number;
  height: number;
  alt: string;
  priority?: boolean;
  /** Develop the image in once the hero intro finishes, instead of swapping it in. */
  waitForIntro?: boolean;
  sizes?: string;
  className?: string;
};

export default function PortraitLens({
  tone,
  color,
  width,
  height,
  alt,
  priority,
  waitForIntro,
  sizes = "50vw",
  className,
}: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallback = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = wrap.current!;
    const canvas = canvasRef.current!;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: true });
    } catch {
      return; // no WebGL: the <Image> fallback stays
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.Camera();
    const uniforms = {
      uTone: { value: null as THREE.Texture | null },
      uColor: { value: null as THREE.Texture | null },
      uMouse: { value: new THREE.Vector2(0.5, 0.6) },
      uRadius: { value: 0 },
      uAspect: { value: width / height },
      uReveal: { value: reduced ? 1 : 0 },
      uTime: { value: 0 },
      uVelocity: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms,
      transparent: true,
      blending: THREE.NoBlending,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const loader = new THREE.TextureLoader();
    const load = (src: string) =>
      new Promise<THREE.Texture>((resolve, reject) =>
        loader.load(
          src,
          (t) => {
            t.colorSpace = THREE.NoColorSpace;
            t.minFilter = THREE.LinearFilter;
            t.generateMipmaps = false;
            resolve(t);
          },
          undefined,
          reject,
        ),
      );

    const resize = () => {
      const { width: w, height: h } = el.getBoundingClientRect();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    // render only while on screen
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
    io.observe(el);

    // pointer → lens. Touch works too: press and drag across the portrait.
    const target = new THREE.Vector2(0.5, 0.6);
    const radius = { v: 0 };
    const lensSize = () => (el.clientWidth < 420 ? 0.26 : 0.2);
    const toUv = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      target.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
    };
    const enter = (e: PointerEvent) => {
      toUv(e);
      uniforms.uMouse.value.copy(target);
      gsap.to(radius, { v: lensSize(), duration: 0.9, ease: "elastic.out(1, 0.55)" });
    };
    const leave = () => gsap.to(radius, { v: 0, duration: 0.5, ease: "power3.out" });
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointermove", toUv);
    el.addEventListener("pointerleave", leave);
    el.addEventListener("pointercancel", leave);

    // scroll velocity, eased
    let lastY = window.scrollY;
    let velocity = 0;

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const y = window.scrollY;
      velocity += (Math.max(-40, Math.min(40, y - lastY)) - velocity) * 0.1;
      lastY = y;
      if (!visible || !uniforms.uTone.value) return;
      uniforms.uTime.value = performance.now() / 1000;
      uniforms.uMouse.value.lerp(target, 0.14);
      uniforms.uRadius.value = radius.v;
      uniforms.uVelocity.value = reduced ? 0 : velocity;
      renderer.render(scene, camera);
    };

    let cancelIntro = () => {};
    let disposed = false;
    Promise.all([load(tone), load(color)])
      .then(([t, c]) => {
        if (disposed) return;
        uniforms.uTone.value = t;
        uniforms.uColor.value = c;
        loop();
        canvas.style.opacity = "1";
        if (fallback.current) fallback.current.style.opacity = "0";
        if (waitForIntro && !reduced) {
          cancelIntro = onIntroDone(() => gsap.to(uniforms.uReveal, { value: 1, duration: 2.2, ease: "power2.inOut" }));
        } else {
          uniforms.uReveal.value = 1;
        }
        // draw one frame now, so the canvas is never blank before the loop's
        // visibility check lets it render (the fallback is already hidden)
        renderer.render(scene, camera);
      })
      .catch(() => {});

    return () => {
      disposed = true;
      cancelIntro();
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointermove", toUv);
      el.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointercancel", leave);
      uniforms.uTone.value?.dispose();
      uniforms.uColor.value?.dispose();
      material.dispose();
      mesh.geometry.dispose();
      renderer.dispose();
    };
  }, [tone, color, width, height, waitForIntro]);

  return (
    <div
      ref={wrap}
      className={`relative select-none ${className ?? ""}`}
      style={{ aspectRatio: `${width} / ${height}`, touchAction: "pan-y" }}
    >
      {/* Static tone image: what search engines, no-WebGL browsers and the
          first paint see. Swapped for the canvas once textures are ready. */}
      <div ref={fallback} className="absolute inset-0 transition-opacity duration-700">
        <Image src={tone} alt={alt} fill priority={priority} sizes={sizes} className="object-contain" />
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300"
      />
    </div>
  );
}
