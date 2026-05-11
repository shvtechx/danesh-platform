'use client';

import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  shape: 'rect' | 'circle' | 'star';
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  life: number;
}

const COLORS = [
  '#f59e0b', '#10b981', '#6366f1', '#ec4899',
  '#14b8a6', '#f97316', '#8b5cf6', '#06b6d4',
];

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function createParticle(canvasWidth: number): Particle {
  return {
    x: randomBetween(0, canvasWidth),
    y: -10,
    vx: randomBetween(-2, 2),
    vy: randomBetween(4, 9),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: (['rect', 'circle', 'star'] as const)[Math.floor(Math.random() * 3)],
    size: randomBetween(6, 14),
    rotation: randomBetween(0, Math.PI * 2),
    rotationSpeed: randomBetween(-0.15, 0.15),
    opacity: 1,
    life: 1,
  };
}

interface Props {
  active: boolean;
  onComplete?: () => void;
}

export default function PublishCelebration({ active, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const spawnedRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    particlesRef.current = [];
    spawnedRef.current = 0;
    startTimeRef.current = performance.now();

    const TOTAL_PARTICLES = 200;
    const SPAWN_DURATION = 1800; // ms to spawn all particles

    function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const fn = i === 0 ? ctx.moveTo.bind(ctx) : ctx.lineTo.bind(ctx);
        fn(x + r * Math.cos(angle), y + r * Math.sin(angle));
      }
      ctx.closePath();
    }

    function animate(now: number) {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const elapsed = now - startTimeRef.current;

      // Spawn particles in bursts
      if (spawnedRef.current < TOTAL_PARTICLES && elapsed < SPAWN_DURATION) {
        const targetCount = Math.floor((elapsed / SPAWN_DURATION) * TOTAL_PARTICLES);
        while (spawnedRef.current < targetCount) {
          particlesRef.current.push(createParticle(canvas.width));
          spawnedRef.current++;
        }
      }

      // Update & draw
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.rotation += p.rotationSpeed;
        p.life -= 0.006;
        p.opacity = Math.max(0, p.life);

        if (p.y > canvas.height + 20 || p.opacity <= 0) return false;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, 0, 0, p.size / 2);
          ctx.fill();
        }

        ctx.restore();
        return true;
      });

      if (particlesRef.current.length > 0 || spawnedRef.current < TOTAL_PARTICLES) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    }

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
