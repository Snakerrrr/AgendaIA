import React, { useRef, useEffect, useCallback } from 'react';

export type BgEffect = 'none' | 'particles' | 'sakura' | 'space';

interface Props {
  effect: BgEffect;
  accentHue: string;
}

export function AnimatedBackground({ effect, accentHue }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const hue = parseInt(accentHue) || 0;

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, d: EffectData, time: number) => {
    ctx.clearRect(0, 0, w, h);
    for (const p of d.particles!) {
      p.y -= p.speed; p.x += Math.sin(time * 0.001 + p.offset) * 0.3;
      if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${p.alpha})`; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${p.alpha * 0.1})`; ctx.fill();
    }
  }, [hue]);

  const drawSakura = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, d: EffectData, time: number) => {
    ctx.clearRect(0, 0, w, h);
    const bg = ctx.createRadialGradient(w * 0.3, h * 0.2, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
    bg.addColorStop(0, 'rgba(60, 20, 30, 0.04)'); bg.addColorStop(1, 'transparent');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(80, 40, 30, 0.08)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, h * 0.15); ctx.bezierCurveTo(w * 0.15, h * 0.1, w * 0.25, h * 0.18, w * 0.35, h * 0.12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.12); ctx.bezierCurveTo(w * 0.22, h * 0.08, w * 0.28, h * 0.05, w * 0.3, h * 0.02); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(w, h * 0.25); ctx.bezierCurveTo(w * 0.85, h * 0.2, w * 0.78, h * 0.28, w * 0.7, h * 0.22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.8, h * 0.22); ctx.bezierCurveTo(w * 0.82, h * 0.15, w * 0.78, h * 0.1, w * 0.75, h * 0.05); ctx.stroke();
    for (const p of d.petals!) {
      p.y += p.fallSpeed; p.x += Math.sin(time * 0.0005 + p.swayOffset) * p.swayAmount + p.drift; p.rotation += p.rotSpeed;
      if (p.y > h + 20) { p.y = -20; p.x = Math.random() * w; }
      if (p.x > w + 20) p.x = -20; if (p.x < -20) p.x = w + 20;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.scale(p.size, p.size);
      ctx.beginPath(); ctx.moveTo(0, -6);
      ctx.bezierCurveTo(4, -5, 6, -1, 5, 2); ctx.bezierCurveTo(4, 5, 1, 7, 0, 6);
      ctx.bezierCurveTo(-1, 7, -4, 5, -5, 2); ctx.bezierCurveTo(-6, -1, -4, -5, 0, -6); ctx.closePath();
      const pg = ctx.createRadialGradient(0, 0, 0, 0, 0, 6);
      pg.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${p.alpha})`);
      pg.addColorStop(1, `rgba(${p.r - 30}, ${p.g - 20}, ${p.b - 20}, ${p.alpha * 0.6})`);
      ctx.fillStyle = pg; ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(0, 4);
      ctx.strokeStyle = `rgba(${p.r - 40}, ${p.g - 30}, ${p.b - 30}, ${p.alpha * 0.3})`; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.restore();
    }
    for (const b of d.blossoms!) {
      const bP = 0.3 + Math.sin(time * 0.001 + b.offset) * 0.15;
      const bg2 = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.size);
      bg2.addColorStop(0, `rgba(255, 180, 200, ${bP * 0.06})`); bg2.addColorStop(1, 'transparent');
      ctx.fillStyle = bg2; ctx.beginPath(); ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2); ctx.fill();
    }
  }, []);

  const drawSpace = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, d: EffectData, time: number) => {
    ctx.clearRect(0, 0, w, h);
    for (const s of d.bgStars!) {
      const t = 0.3 + Math.sin(time * s.speed + s.offset) * 0.4 + 0.4;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${s.hue ?? 220}, ${s.sat ?? 30}%, 85%, ${t * s.alpha})`; ctx.fill();
    }
    const cx = w * 0.65, cy = h * 0.5;
    for (const p of d.planets!) {
      ctx.beginPath(); ctx.ellipse(cx, cy, p.orbitX, p.orbitY, 0, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(${hue}, 40%, 40%, 0.06)`; ctx.lineWidth = 1; ctx.stroke();
    }
    for (const p of d.planets!) {
      const a = (time * p.speed) + p.startAngle;
      const px = cx + Math.cos(a) * p.orbitX, py = cy + Math.sin(a) * p.orbitY;
      const gg = ctx.createRadialGradient(px, py, 0, px, py, p.size * 4);
      gg.addColorStop(0, `hsla(${p.hue}, 70%, 55%, 0.15)`); gg.addColorStop(1, 'transparent');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(px, py, p.size * 4, 0, Math.PI * 2); ctx.fill();
      const bg = ctx.createRadialGradient(px - p.size * 0.3, py - p.size * 0.3, 0, px, py, p.size);
      bg.addColorStop(0, `hsla(${p.hue}, 60%, 65%, 0.9)`); bg.addColorStop(1, `hsla(${p.hue}, 50%, 30%, 0.8)`);
      ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(px, py, p.size, 0, Math.PI * 2); ctx.fill();
      if (p.hasRing) { ctx.strokeStyle = `hsla(${p.hue}, 50%, 60%, 0.3)`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, py, p.size * 2, p.size * 0.5, -0.3, 0, Math.PI * 2); ctx.stroke(); }
    }
    const sg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 40);
    sg.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.25)`); sg.addColorStop(0.5, `hsla(${hue}, 80%, 50%, 0.08)`); sg.addColorStop(1, 'transparent');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, Math.PI * 2); ctx.fill();
  }, [hue]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || effect === 'none') return;
    const ctx = canvas.getContext('2d')!;
    let w = canvas.parentElement!.clientWidth;
    let h = canvas.parentElement!.clientHeight;
    canvas.width = w; canvas.height = h;
    const data: EffectData = {};

    if (effect === 'particles') {
      data.particles = Array.from({ length: 80 }, () => ({
        x: Math.random() * w, y: Math.random() * h, size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.4 + 0.1, alpha: Math.random() * 0.5 + 0.1, offset: Math.random() * Math.PI * 2,
      }));
    }

    if (effect === 'sakura') {
      data.petals = Array.from({ length: 50 }, () => {
        const sh = Math.random();
        return {
          x: Math.random() * w, y: Math.random() * h, size: Math.random() * 1.2 + 0.5,
          fallSpeed: Math.random() * 0.6 + 0.2, drift: (Math.random() - 0.5) * 0.3,
          swayAmount: Math.random() * 1.5 + 0.5, swayOffset: Math.random() * Math.PI * 2,
          rotation: Math.random() * Math.PI * 2, rotSpeed: (Math.random() - 0.5) * 0.01,
          alpha: Math.random() * 0.4 + 0.2,
          r: Math.floor(230 + sh * 25), g: Math.floor(140 + sh * 50), b: Math.floor(160 + sh * 40),
        };
      });
      data.blossoms = Array.from({ length: 8 }, () => ({
        x: Math.random() * w, y: Math.random() * h * 0.6, size: 30 + Math.random() * 50, offset: Math.random() * Math.PI * 2,
      }));
    }

    if (effect === 'space') {
      data.bgStars = Array.from({ length: 200 }, () => ({
        x: Math.random() * w, y: Math.random() * h, size: Math.random() * 1.5 + 0.3,
        alpha: Math.random() * 0.6 + 0.2, speed: Math.random() * 0.003 + 0.001,
        offset: Math.random() * Math.PI * 2, hue: Math.random() > 0.7 ? hue : (Math.random() * 60 + 200),
        sat: Math.random() * 30 + 20,
      }));
      data.planets = [
        { orbitX: 80, orbitY: 50, size: 4, speed: 0.0003, startAngle: 0, hue, hasRing: false },
        { orbitX: 140, orbitY: 90, size: 7, speed: 0.00018, startAngle: 2.5, hue: (hue + 30) % 360, hasRing: false },
        { orbitX: 210, orbitY: 130, size: 12, speed: 0.0001, startAngle: 4.2, hue: (hue + 60) % 360, hasRing: true },
        { orbitX: 290, orbitY: 180, size: 5, speed: 0.00007, startAngle: 1.1, hue: (hue + 150) % 360, hasRing: false },
        { orbitX: 360, orbitY: 220, size: 3, speed: 0.00004, startAngle: 3.8, hue: (hue + 200) % 360, hasRing: false },
      ];
    }

    const fns: Record<string, (c: CanvasRenderingContext2D, w: number, h: number, d: EffectData, t: number) => void> = {
      particles: drawParticles, sakura: drawSakura, space: drawSpace,
    };
    const fn = fns[effect];
    const onResize = () => { w = canvas.parentElement!.clientWidth; h = canvas.parentElement!.clientHeight; canvas.width = w; canvas.height = h; };
    const loop = (t: number) => { fn?.(ctx, w, h, data, t); animRef.current = requestAnimationFrame(loop); };
    window.addEventListener('resize', onResize);
    animRef.current = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', onResize); };
  }, [effect, hue, drawParticles, drawSakura, drawSpace]);

  if (effect === 'none') return null;
  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

interface Dot { x: number; y: number; size: number; speed: number; alpha: number; offset: number; hue?: number; sat?: number }
interface Petal { x: number; y: number; size: number; fallSpeed: number; drift: number; swayAmount: number; swayOffset: number; rotation: number; rotSpeed: number; alpha: number; r: number; g: number; b: number }
interface Blossom { x: number; y: number; size: number; offset: number }
interface PlanetObj { orbitX: number; orbitY: number; size: number; speed: number; startAngle: number; hue: number; hasRing: boolean }
interface EffectData { particles?: Dot[]; bgStars?: Dot[]; petals?: Petal[]; blossoms?: Blossom[]; planets?: PlanetObj[] }
