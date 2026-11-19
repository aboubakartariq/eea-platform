"use client";

/**
 * The homepage hero: the three students from the EEA seal on a winners' podium,
 * with the gold star above them and confetti in the brand colours.
 * Built from primitives (no model or font downloads), so it loads fast and works offline.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, PerspectiveCamera, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { rng } from "@/lib/exam/engine";

const C = {
  navy: "#2E3192",
  navyDeep: "#1B1D63",
  blue: "#0072BC",
  orange: "#F7941D",
  magenta: "#EC008C",
  purple: "#662D91",
  gold: "#F7B21D",
  silver: "#C9CEDB",
  bronze: "#D98A4E",
};

const easeOutBack = (t: number) => {
  const c1 = 1.5, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

/** Time since the scene mounted, shared by every part of the intro. */
function useIntro(reduced: boolean) {
  const start = useRef<number | null>(null);
  return (clock: THREE.Clock, delay: number, duration: number) => {
    if (reduced) return 1;
    if (start.current === null) start.current = clock.elapsedTime;
    return clamp01((clock.elapsedTime - start.current - delay) / duration);
  };
}

type StepProps = { x: number; height: number; rim: string; figure: string; delay: number; armsUp?: boolean; reduced: boolean; intro: ReturnType<typeof useIntro> };

function Step({ x, height, rim, figure, delay, armsUp, reduced, intro }: StepProps) {
  const block = useRef<THREE.Group>(null);
  const person = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = intro(clock, delay, 0.9);
    const p = intro(clock, delay + 0.45, 0.7);
    if (block.current) block.current.position.y = THREE.MathUtils.lerp(-height - 1.2, 0, easeOutBack(t));
    if (person.current) {
      const s = easeOutBack(p);
      person.current.scale.setScalar(Math.max(0.001, s));
      // A gentle breathing bob once they're up.
      person.current.position.y = height + (reduced ? 0 : Math.sin(clock.elapsedTime * 1.6 + x) * 0.03 * p);
    }
  });
  return (
    <group position={[x, 0, 0]}>
      <group ref={block}>
        <RoundedBox args={[1.25, height, 1.25]} radius={0.08} smoothness={4} position={[0, height / 2, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#EEF0FB" roughness={0.28} metalness={0} clearcoat={0.6} clearcoatRoughness={0.25} />
        </RoundedBox>
        {/* Gold / silver / bronze cap */}
        <RoundedBox args={[1.3, 0.09, 1.3]} radius={0.04} smoothness={3} position={[0, height + 0.02, 0]} castShadow>
          <meshStandardMaterial color={rim} roughness={0.25} metalness={0.75} />
        </RoundedBox>
        {/* Thin metal band near the base */}
        <RoundedBox args={[1.27, 0.06, 1.27]} radius={0.025} smoothness={3} position={[0, 0.16, 0]}>
          <meshStandardMaterial color={rim} roughness={0.25} metalness={0.75} />
        </RoundedBox>
      </group>
      <group ref={person} position={[0, height, 0]}>
        <Figure color={figure} armsUp={armsUp} />
      </group>
    </group>
  );
}

function Figure({ color, armsUp }: { color: string; armsUp?: boolean }) {
  const mat = <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />;
  return (
    <group position={[0, 0.06, 0]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <capsuleGeometry args={[0.24, 0.42, 8, 24]} />
        {mat}
      </mesh>
      <mesh position={[0, 1.17, 0]} castShadow>
        <sphereGeometry args={[0.2, 32, 32]} />
        {mat}
      </mesh>
      {armsUp &&
        [-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.36, 1.02, 0]} rotation={[0, 0, side * -0.55]} castShadow>
            <capsuleGeometry args={[0.07, 0.44, 6, 16]} />
            {mat}
          </mesh>
        ))}
    </group>
  );
}

function Star({ reduced, intro }: { reduced: boolean; intro: ReturnType<typeof useIntro> }) {
  const ref = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const outer = 0.36, inner = 0.15;
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      const [px, py] = [Math.cos(a) * r, Math.sin(a) * r];
      if (i === 0) shape.moveTo(px, py);
      else shape.lineTo(px, py);
    }
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 4 });
    g.center();
    return g;
  }, []);
  useFrame(({ clock }, dt) => {
    if (!ref.current) return;
    const t = intro(clock, 1.6, 1.1);
    const e = easeOutBack(t);
    ref.current.position.y = THREE.MathUtils.lerp(6, 3.75, e) + (reduced ? 0 : Math.sin(clock.elapsedTime * 1.2) * 0.08);
    ref.current.scale.setScalar(Math.max(0.001, e));
    if (!reduced) ref.current.rotation.y += dt * (0.9 + (1 - t) * 6);
  });
  return (
    <mesh ref={ref} geometry={geometry} position={[0, 3.75, 0]} castShadow>
      <meshStandardMaterial color={C.gold} emissive={C.orange} emissiveIntensity={0.35} roughness={0.2} metalness={0.9} />
    </mesh>
  );
}

const CONFETTI = 160;
const CONFETTI_COLORS = [C.orange, C.blue, C.magenta, C.purple, C.gold, "#ffffff"];

function Confetti({ reduced }: { reduced: boolean }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const pieces = useMemo(() => {
    const r = rng(2027);
    return Array.from({ length: CONFETTI }, (_, i) => ({
      x: (r() - 0.5) * 9,
      y: r() * 7 + 1,
      z: (r() - 0.5) * 4 - 0.5,
      speed: 0.35 + r() * 0.55,
      sway: r() * Math.PI * 2,
      spin: (r() - 0.5) * 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    }));
  }, []);
  useEffect(() => {
    if (!mesh.current) return;
    const color = new THREE.Color();
    pieces.forEach((p, i) => mesh.current!.setColorAt(i, color.set(p.color)));
    mesh.current.instanceColor!.needsUpdate = true;
  }, [pieces]);
  useFrame(({ clock }, dt) => {
    if (!mesh.current) return;
    const t = clock.elapsedTime;
    pieces.forEach((p, i) => {
      if (!reduced) {
        p.y -= p.speed * Math.min(dt, 0.05);
        if (p.y < -0.5) { p.y = 7.5; p.x = (Math.random() - 0.5) * 9; }
      }
      dummy.position.set(p.x + Math.sin(t * 0.8 + p.sway) * 0.25, p.y, p.z);
      dummy.rotation.set(t * p.spin * 0.5 + p.sway, t * p.spin + p.sway, p.sway);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, CONFETTI]}>
      <planeGeometry args={[0.09, 0.15]} />
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.5} metalness={0.2} />
    </instancedMesh>
  );
}

/** Tilts the whole stage a little toward the pointer. */
function Stage({ reduced, children }: { reduced: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const { pointer } = useThree();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const idle = reduced ? 0 : Math.sin(clock.elapsedTime * 0.25) * 0.12;
    const targetY = -0.35 + (reduced ? 0 : pointer.x * 0.35) + idle;
    const targetX = reduced ? 0 : -pointer.y * 0.08;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetY, 0.05);
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, targetX, 0.05);
  });
  return <group ref={ref}>{children}</group>;
}

/** Pulls the camera back on narrow (portrait) screens so the whole podium fits. */
function FitCamera() {
  const size = useThree((st) => st.size);
  const aspect = size.width / Math.max(1, size.height);
  const z = aspect < 1.1 ? 8.2 * Math.min(1.9, 1.1 / aspect) : 8.2;
  const cam = useRef<THREE.PerspectiveCamera>(null);
  useEffect(() => cam.current?.lookAt(0, 0.35, 0), [z]);
  return <PerspectiveCamera ref={cam} makeDefault fov={38} position={[0, 1.5, z]} />;
}

function Scene({ reduced }: { reduced: boolean }) {
  const intro = useIntro(reduced);
  return (
    <>
      <FitCamera />
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 7, 5]} intensity={2.2} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-4, 2.5, 2]} intensity={18} color={C.blue} distance={12} />
      <pointLight position={[4, 2, 2]} intensity={18} color={C.magenta} distance={12} />
      <spotLight position={[0, 9, 2]} angle={0.45} penumbra={0.8} intensity={60} color="#fff4e0" castShadow />
      <Stage reduced={reduced}>
        <group position={[0, -1.6, 0]}>
          <Step x={-1.32} height={1.05} rim={C.silver} figure={C.orange} delay={0.15} reduced={reduced} intro={intro} />
          <Step x={0} height={1.6} rim={C.gold} figure={C.blue} delay={0} armsUp reduced={reduced} intro={intro} />
          <Step x={1.32} height={0.7} rim={C.bronze} figure={C.magenta} delay={0.3} reduced={reduced} intro={intro} />
          <Star reduced={reduced} intro={intro} />
          <ContactShadows position={[0, 0.001, 0]} opacity={0.55} scale={9} blur={2.6} far={4} color="#05061f" />
        </group>
        <Confetti reduced={reduced} />
      </Stage>
    </>
  );
}

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function PodiumScene({ reduced, active }: { reduced: boolean; active: boolean }) {
  // This module only loads in the browser, so checking once here is safe.
  const [webgl] = useState(hasWebGL);
  if (!webgl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src="/brand/eea-seal.svg" alt="" className="absolute inset-0 m-auto w-1/2 opacity-90" />;
  }
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      frameloop={active && !reduced ? "always" : "demand"}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden
    >
      <Scene reduced={reduced} />
    </Canvas>
  );
}
