import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLocation } from "react-router-dom";
import * as THREE from "three";

interface ParticleSystemProps {
  count?: number;
}

function FloatingParticles({ count = 1500 }: ParticleSystemProps) {
  const pointsRef = useRef<THREE.Points>(null);

  // Create random position, velocity, and size data for the particle field
  const [positions, velocities, sizes, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const col = new Float32Array(count * 3);

    const baseColor1 = new THREE.Color("#00F0FF");
    const baseColor2 = new THREE.Color("#8A2BE2");

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 15;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;

      vel[i * 3] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.002;

      sz[i] = Math.random() * 0.08 + 0.02;

      const mixRatio = Math.random();
      const finalCol = new THREE.Color().lerpColors(baseColor1, baseColor2, mixRatio);
      col[i * 3] = finalCol.r;
      col[i * 3 + 1] = finalCol.g;
      col[i * 3 + 2] = finalCol.b;
    }
    return [pos, vel, sz, col];
  }, [count]);

  const mouse = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouse.current.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();

    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.05;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.05;

    pointsRef.current.rotation.y = time * 0.02 + mouse.current.x * 0.15;
    pointsRef.current.rotation.x = time * 0.01 + mouse.current.y * 0.15;

    const geo = pointsRef.current.geometry;
    const posArr = geo.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      posArr[idx] += velocities[idx];
      posArr[idx + 1] += velocities[idx + 1];
      posArr[idx + 2] += velocities[idx + 2];

      posArr[idx + 1] += Math.sin(time + posArr[idx]) * 0.001;

      if (Math.abs(posArr[idx]) > 8) posArr[idx] = -posArr[idx] * 0.9;
      if (Math.abs(posArr[idx + 1]) > 8) posArr[idx + 1] = -posArr[idx + 1] * 0.9;
      if (posArr[idx + 2] > 2 || posArr[idx + 2] < -12) velocities[idx + 2] *= -1;
    }

    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        map={createCircleTexture()}
      />
    </points>
  );
}

function createCircleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
  gradient.addColorStop(0.2, "rgba(255, 255, 255, 0.8)");
  gradient.addColorStop(0.5, "rgba(255, 255, 255, 0.2)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// Maps active routes to custom neon cyberpunk light colors
const PAGE_COLORS: Record<string, { color1: string; color2: string }> = {
  "/": { color1: "#00F0FF", color2: "#8A2BE2" }, // Swap (Cyan & Violet)
  "/swap": { color1: "#00F0FF", color2: "#8A2BE2" },
  "/trending": { color1: "#FF5E00", color2: "#FB118E" }, // Trending (Orange & Pink)
  "/transfer": { color1: "#00F0FF", color2: "#FB118E" }, // Transfer (Cyan & Pink)
  "/explore": { color1: "#8A2BE2", color2: "#00FF66" }, // Explore (Violet & Green)
  "/liquidity": { color1: "#00FF66", color2: "#00F0FF" }, // Liquidity (Green & Cyan)
  "/wallet": { color1: "#0044FF", color2: "#8A2BE2" }, // Wallet (Blue & Violet)
  "/about": { color1: "#FB118E", color2: "#8A2BE2" }, // About (Pink & Violet)
  "/contact": { color1: "#00FF66", color2: "#8A2BE2" }, // Contact (Green & Violet)
};

function GlowingAtmosphere() {
  const lightRef1 = useRef<THREE.PointLight>(null);
  const lightRef2 = useRef<THREE.PointLight>(null);
  const location = useLocation();

  // Resolve target color mapping for active page
  const activeColors = useMemo(() => {
    return PAGE_COLORS[location.pathname] || PAGE_COLORS["/"];
  }, [location.pathname]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const mouseX = state.pointer.x * 5;
    const mouseY = state.pointer.y * 5;

    // Convert target colors
    const targetC1 = new THREE.Color(activeColors.color1);
    const targetC2 = new THREE.Color(activeColors.color2);

    if (lightRef1.current) {
      lightRef1.current.position.x = THREE.MathUtils.lerp(lightRef1.current.position.x, mouseX - 1.5, 0.05);
      lightRef1.current.position.y = THREE.MathUtils.lerp(lightRef1.current.position.y, mouseY + 1, 0.05);
      lightRef1.current.position.z = Math.sin(time) * 2 + 1;
      
      // Smooth color shift between pages
      lightRef1.current.color.lerp(targetC1, 0.05);
    }

    if (lightRef2.current) {
      lightRef2.current.position.x = THREE.MathUtils.lerp(lightRef2.current.position.x, -mouseX + 1.5, 0.03);
      lightRef2.current.position.y = THREE.MathUtils.lerp(lightRef2.current.position.y, -mouseY - 1, 0.03);
      lightRef2.current.position.z = Math.cos(time) * 2 + 2;
      
      // Smooth color shift between pages
      lightRef2.current.color.lerp(targetC2, 0.05);
    }
  });

  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight
        ref={lightRef1}
        intensity={22}
        distance={15}
        decay={2}
      />
      <pointLight
        ref={lightRef2}
        intensity={25}
        distance={15}
        decay={2}
      />
    </>
  );
}

export function BackgroundCanvas() {
  return (
    <div className="absolute inset-0 w-full h-full bg-[#050505] overflow-hidden pointer-events-none select-none z-0">
      <div className="absolute inset-0 bg-radial-at-t from-[#0d0722] via-[#050505] to-[#050505] opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-950/10 via-[#050505] to-[#050505]" />
      
      <Canvas
        camera={{ position: [0, 0, 5], fov: 60 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        className="w-full h-full opacity-60"
      >
        <color attach="background" args={["#050505"]} />
        <fog attach="fog" args={["#050505", 3, 10]} />
        
        <FloatingParticles count={1200} />
        <GlowingAtmosphere />
      </Canvas>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,36,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] pointer-events-none opacity-40 mix-blend-overlay" />
      <div 
        className="absolute inset-0 pointer-events-none opacity-5 bg-[size:32px_32px]" 
        style={{
          backgroundImage: `radial-gradient(circle, rgba(0, 240, 255, 0.15) 1px, transparent 1px)`
        }}
      />
    </div>
  );
}
