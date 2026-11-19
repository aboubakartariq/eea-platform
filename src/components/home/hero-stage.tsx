"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const PodiumScene = dynamic(() => import("./podium-scene"), { ssr: false, loading: () => null });

const REDUCED = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

/** Loads the 3D podium after the page, pauses it off-screen, and keeps it still for reduced motion. */
export function HeroStage() {
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(REDUCED).matches, () => false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0.05 });
    if (box.current) io.observe(box.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={box} className="relative h-full w-full">
      {/* Spotlight on the stage floor; shows before the 3D loads */}
      <div aria-hidden className="absolute inset-x-[8%] bottom-[6%] h-[38%] rounded-[50%] bg-[radial-gradient(closest-side,rgba(255,236,200,0.22),transparent)]" />
      <div aria-hidden className="absolute top-0 left-1/2 h-full w-[60%] -translate-x-1/2 bg-[conic-gradient(from_180deg_at_50%_0%,transparent_160deg,rgba(255,244,224,0.10)_180deg,transparent_200deg)]" />
      <PodiumScene reduced={reduced} active={active} />
    </div>
  );
}
