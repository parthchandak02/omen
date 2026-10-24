import React from "react";
import { useToolcraftValue } from "@/toolcraft/runtime/react";
import { fetchNameData, generateRandomName, isoToColor, FALLBACK_DATA, type NameData } from "../nameService";

const PALETTE = {
  bg: '#0d0a08',
  overlay: '#1a0e0a',
  accent1: '#ff6d00',
  accent2: '#dd2c00',
  accent3: '#ffab00',
  glow: '#ff9100',
  text: 'rgba(255,255,255,0.5)',
};

const COOL = '#4fc3f7';
const WARM = '#ff8a65';
const MALE_BLUE = '#4fc3f7';
const FEMALE_PINK = '#f48fb1';

function hexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

function lerpColor(c1: string, c2: string, t: number) {
  const a = hexToRgb(c1), b = hexToRgb(c2);
  const clamped = Math.max(0, Math.min(1, t));
  return `rgb(${Math.round(a.r + (b.r - a.r) * clamped)},${Math.round(a.g + (b.g - a.g) * clamped)},${Math.round(a.b + (b.b - a.b) * clamped)})`;
}

const COUNTRIES: [string, string][] = [
  ['US','#3b82f6'],['GB','#ef4444'],['CA','#f59e0b'],['AU','#8b5cf6'],
  ['DE','#f97316'],['FR','#06b6d4'],['IT','#10b981'],['ES','#ec4899'],
  ['IN','#ff6b35'],['CN','#e11d48'],['JP','#d946ef'],['BR','#22c55e'],
  ['MX','#84cc16'],['RU','#6366f1'],['KR','#a855f7'],['AR','#14b8a6'],
  ['NL','#f97316'],['SE','#0ea5e9'],['NO','#ef4444'],['DK','#f43f5e'],
  ['FI','#3b82f6'],['IE','#22c55e'],['CH','#dc2626'],['PT','#e11d48'],
  ['PL','#a855f7'],['GR','#2563eb'],['CZ','#f59e0b'],['HU','#84cc16'],
  ['AT','#ef4444'],['BE','#f97316'],['BG','#22c55e'],['RO','#2563eb'],
  ['UA','#fbbf24'],['TR','#e11d48'],['IL','#3b82f6'],['ZA','#a855f7'],
  ['NG','#10b981'],['EG','#f59e0b'],['KE','#ef4444'],['PH','#06b6d4'],
  ['VN','#ec4899'],['TH','#6366f1'],['ID','#dc2626'],['MY','#f97316'],
  ['SG','#ef4444'],['NZ','#8b5cf6'],['PK','#22c55e'],['BD','#10b981'],
  ['SA','#84cc16'],['AE','#f59e0b'],['QA','#ef4444'],['CL','#06b6d4'],
  ['CO','#f97316'],['PE','#a855f7'],
];

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  color: string;
  size: number;
  phase: number;
}

export interface OmenCanvasHandle {
  triggerRandom: () => void;
}

interface Props {
  nameDataRef?: React.MutableRefObject<NameData | null>;
  onDataUpdate?: (data: NameData, stamp: string) => void;
}

export function OmenCanvas({ nameDataRef, onDataUpdate }: Props): React.JSX.Element {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const dataRef = React.useRef<NameData>({ ...FALLBACK_DATA });
  const targetDataRef = React.useRef<NameData>({ ...FALLBACK_DATA });
  const particlesRef = React.useRef<Particle[]>([]);
  const animRef = React.useRef(0);
  const timeRef = React.useRef(0);
  const fetchIdRef = React.useRef(0);
  const transitionRef = React.useRef(0);
  const selectedDataRef = React.useRef<NameData | null>(null);
  const [quietZone, setQuietZone] = React.useState<NameData | null>(null);
  const [stamp, setStamp] = React.useState('Agify + Genderize + Nationalize · prediction · loading...');

  const particleCount = (useToolcraftValue('particleCount') as number) ?? 20;
  const auraSpeed = (useToolcraftValue('auraSpeed') as number) ?? 0.5;

  const muted = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const doFetch = React.useCallback((name: string) => {
    const id = ++fetchIdRef.current;
    setStamp(`Agify + Genderize + Nationalize · prediction · loading "${name}"...`);
    fetchNameData(name).then(({ data, status, reason }) => {
      if (id !== fetchIdRef.current) return;
      targetDataRef.current = data;
      transitionRef.current = 0;
      if (nameDataRef) nameDataRef.current = data;
      const stampText = status === 'live'
        ? 'Agify + Genderize + Nationalize · prediction · live · just now'
        : `Agify + Genderize + Nationalize · ${reason ?? 'unavailable'} · fallback · sample data for "Alex"`;
      const notice = status === 'live'
        ? null
        : status === 'rate-limited'
          ? `Couldn't look up "${name}": the free prediction APIs' daily limit is used up. Showing sample data for "Alex".`
          : `Couldn't look up "${name}" (${reason ?? 'error'}). Showing sample data for "Alex".`;
      setStamp(stampText);
      if (onDataUpdate) onDataUpdate(data, stampText);
      // Dispatch event for route chrome
      window.dispatchEvent(new CustomEvent('omen-data-update', {
        detail: { stamp: stampText, age: data.age, name: data.name, notice }
      }));
    });
  }, [nameDataRef, onDataUpdate]);

  // Initial fetch
  React.useEffect(() => {
    doFetch('alex');
  }, [doFetch]);

  // Listen for random name events from toolbar button
  React.useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent).detail as string;
      doFetch(name);
    };
    window.addEventListener('omen-random-name', handler);
    return () => window.removeEventListener('omen-random-name', handler);
  }, [doFetch]);

  // Watch name input changes
  const nameValue = useToolcraftValue('nameInput') as string;

  React.useEffect(() => {
    if (!nameValue || nameValue.trim().length === 0) return;
    const timer = setTimeout(() => doFetch(nameValue), 400);
    return () => clearTimeout(timer);
  }, [nameValue, doFetch]);

  // Init particles
  React.useEffect(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      const country = COUNTRIES[i % COUNTRIES.length];
      particles.push({
        angle: Math.random() * Math.PI * 2,
        radius: 100 + Math.random() * 140,
        speed: (0.15 + Math.random() * 0.4) * (Math.random() > 0.5 ? 1 : -1),
        color: country[1],
        size: 1.5 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    particlesRef.current = particles;
  }, []);

  // Animation loop
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W: number, H: number;
    let dpr: number;

    // Size the drawing buffer to the canvas element itself, not the window: on narrow
    // screens the two differ and the drawing would be stretched
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas!.clientWidth || window.innerWidth;
      H = canvas!.clientHeight || window.innerHeight;
      canvas!.width = W * dpr;
      canvas!.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    const listener = () => resize();
    window.addEventListener('resize', listener);
    const resizeObserver = new ResizeObserver(listener);
    resizeObserver.observe(canvas);

    let useCount = particleCount;
    let useSpeed = auraSpeed;

    function draw(ts: number) {
      if (!muted) animRef.current = requestAnimationFrame(draw);
      const dt = muted ? 0 : Math.min((ts - timeRef.current) / 1000, 0.1);
      timeRef.current = ts;

      useCount = particleCount;
      useSpeed = auraSpeed;

      // Smooth transition
      transitionRef.current = Math.min(transitionRef.current + dt * 3, 1);
      if (transitionRef.current < 1) {
        const t = transitionRef.current;
        dataRef.current = {
          name: targetDataRef.current.name,
          age: dataRef.current.age !== null && targetDataRef.current.age !== null
            ? dataRef.current.age + (targetDataRef.current.age - dataRef.current.age) * t
            : (targetDataRef.current.age ?? dataRef.current.age),
          ageCount: targetDataRef.current.ageCount,
          gender: targetDataRef.current.gender,
          genderProbability: dataRef.current.genderProbability + (targetDataRef.current.genderProbability - dataRef.current.genderProbability) * t,
          genderCount: targetDataRef.current.genderCount,
          countries: targetDataRef.current.countries,
        };
      } else {
        dataRef.current = { ...targetDataRef.current };
      }

      const d = dataRef.current;

      // Clear with trail effect
      ctx!.fillStyle = PALETTE.bg;
      ctx!.fillRect(0, 0, W, H);

      // Center
      const cx = W / 2;
      const cy = H / 2 - 20;

      // Draw background radial glow
      const grad = ctx!.createRadialGradient(cx, cy, 20, cx, cy, Math.min(W, H) * 0.4);
      grad.addColorStop(0, 'rgba(255,107,0,0.06)');
      grad.addColorStop(0.5, 'rgba(255,107,0,0.02)');
      grad.addColorStop(1, 'transparent');
      ctx!.fillStyle = grad;
      ctx!.fillRect(0, 0, W, H);

      // Pulsing center glow
      const pulse = 0.5 + 0.5 * Math.sin(ts / 1500 * useSpeed + Math.PI);

      // Orbiting particles
      const activeParticles = particlesRef.current.slice(0, useCount);
      for (const p of activeParticles) {
        p.angle += dt * p.speed * useSpeed * 0.3;
        const x = cx + Math.cos(p.angle) * p.radius;
        const y = cy + Math.sin(p.angle) * p.radius;
        const alpha = 0.3 + 0.4 * Math.sin(ts / 1000 * useSpeed + p.phase);

        ctx!.save();
        ctx!.globalAlpha = alpha;
        ctx!.shadowBlur = 12;
        ctx!.shadowColor = p.color;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(x, y, p.size * (0.8 + 0.2 * Math.sin(ts / 800 + p.phase)), 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }

      // --- Age bar (upward from center) ---
      const age = d.age ?? 0;
      const maxAge = 90;
      const barMaxH = Math.min(W, 400) * 0.35;
      const ageH = Math.min(age / maxAge, 1) * barMaxH;
      const ageColor = lerpColor(COOL, WARM, age / maxAge);

      if (age > 0) {
        ctx!.save();
        ctx!.shadowBlur = 20;
        ctx!.shadowColor = ageColor;
        ctx!.strokeStyle = ageColor;
        ctx!.lineWidth = 3;
        ctx!.beginPath();
        ctx!.moveTo(cx, cy);
        ctx!.lineTo(cx, cy - ageH);
        ctx!.stroke();
        ctx!.restore();

        // Top cap
        ctx!.save();
        ctx!.shadowBlur = 15;
        ctx!.shadowColor = ageColor;
        ctx!.fillStyle = ageColor;
        ctx!.beginPath();
        ctx!.arc(cx, cy - ageH, 5, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();

        // Age label
        ctx!.save();
        ctx!.globalAlpha = 0.7;
        ctx!.fillStyle = PALETTE.text;
        ctx!.font = '10px system-ui, sans-serif';
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'bottom';
        ctx!.fillText(`${Math.round(age)} years · ${d.ageCount.toLocaleString()} samples`, cx, cy - ageH - 6);
        ctx!.restore();
      }

      // --- Gender split bar (right from center) ---
      const barW = Math.min(W * 0.18, 160);
      const gp = d.genderProbability;
      const maleW = d.gender === 'male' ? barW * gp : barW * (1 - gp);
      const femaleW = barW - maleW;

      const genderX = cx + 30;

      // Male segment
      ctx!.save();
      ctx!.shadowBlur = 10;
      ctx!.shadowColor = MALE_BLUE;
      ctx!.fillStyle = MALE_BLUE;
      ctx!.globalAlpha = 0.7;
      const maleBarW = Math.max(maleW, 0);
      ctx!.fillRect(genderX, cy - 4, maleBarW, 8);
      ctx!.restore();

      // Female segment
      if (femaleW > 0) {
        ctx!.save();
        ctx!.shadowBlur = 10;
        ctx!.shadowColor = FEMALE_PINK;
        ctx!.fillStyle = FEMALE_PINK;
        ctx!.globalAlpha = 0.7;
        ctx!.fillRect(genderX + maleW, cy - 4, femaleW, 8);
        ctx!.restore();
      }

      // Gender labels
      ctx!.save();
      ctx!.globalAlpha = 0.6;
      ctx!.fillStyle = MALE_BLUE;
      ctx!.font = '9px system-ui, sans-serif';
      ctx!.textAlign = 'left';
      ctx!.textBaseline = 'top';
      ctx!.fillText(`M ${Math.round(gp * 100)}%`, genderX, cy + 10);
      ctx!.fillStyle = FEMALE_PINK;
      ctx!.textAlign = 'right';
      ctx!.fillText(`F ${Math.round((1 - gp) * 100)}%`, genderX + barW, cy + 10);
      ctx!.restore();

      // --- Nationality stacked bar (left from center) ---
      const natX = cx - 30 - barW;
      const natBarW = Math.min(W * 0.18, 150);
      const topCountries = d.countries.slice(0, 5);
      let offsetX = natX;

      for (const c of topCountries) {
        const segW = c.probability * natBarW;
        const col = isoToColor(c.code);
        ctx!.save();
        ctx!.shadowBlur = 8;
        ctx!.shadowColor = col;
        ctx!.fillStyle = col;
        ctx!.globalAlpha = 0.8;
        ctx!.fillRect(offsetX, cy - 4, segW, 8);
        ctx!.restore();

        // Country code label
        ctx!.save();
        ctx!.globalAlpha = 0.5;
        ctx!.fillStyle = PALETTE.text;
        ctx!.font = '8px system-ui, sans-serif';
        ctx!.textAlign = 'center';
        ctx!.textBaseline = 'top';
        ctx!.fillText(c.code, offsetX + segW / 2, cy + 10);
        ctx!.restore();

        offsetX += segW;
      }

      // --- Name text (center) ---
      const displayName = d.name.charAt(0).toUpperCase() + d.name.slice(1);
      ctx!.save();
      ctx!.shadowBlur = 30 + pulse * 15;
      ctx!.shadowColor = PALETTE.glow;
      ctx!.fillStyle = PALETTE.accent3;
      ctx!.font = `bold ${Math.min(W * 0.06, 28)}px system-ui, sans-serif`;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText(displayName, cx, cy);
      ctx!.restore();

      // Axis labels
      const labelY = 20;
      ctx!.save();
      ctx!.globalAlpha = 0.35;
      ctx!.fillStyle = PALETTE.text;
      ctx!.font = '9px system-ui, sans-serif';
      ctx!.textAlign = 'center';

      // Age label (top)
      ctx!.fillText('AGE', cx, labelY);

      // Gender label (right)
      ctx!.textAlign = 'center';
      ctx!.fillText('GENDER', cx + Math.min(W * 0.18, 160) / 2 + 30, H - 60);

      // Nationality label (left)
      ctx!.textAlign = 'center';
      ctx!.fillText('NATIONALITY', cx - Math.min(W * 0.18, 150) / 2 - 30, H - 60);

      ctx!.restore();
    }

    if (!muted) {
      animRef.current = requestAnimationFrame(draw);
    } else {
      draw(performance.now());
    }

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', listener);
      resizeObserver.disconnect();
    };
  }, [muted, particleCount, auraSpeed]);

  // Click handler
  const handleClick = React.useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const d = dataRef.current;
    if (!d) return;
    setQuietZone(d);
    setTimeout(() => setQuietZone(null), 4000);
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'manipulation', cursor: 'crosshair' }}
        onClick={handleClick}
      />

      {/* Quiet Zone */}
      {quietZone && (
        <div
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(26,14,10,0.9)',
            border: '1px solid rgba(255,107,0,0.3)',
            borderRadius: '12px',
            padding: '16px 20px',
            color: 'rgba(255,255,255,0.85)',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '12px',
            lineHeight: '1.6',
            zIndex: 100,
            maxWidth: '320px',
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#ffab00', marginBottom: 6, fontSize: 14 }}>
            {quietZone.name.charAt(0).toUpperCase() + quietZone.name.slice(1)}
          </div>
          <div>Predicted Age: <span style={{ color: '#ff6d00' }}>{quietZone.age ?? '—'}</span> ({quietZone.ageCount.toLocaleString()} samples)</div>
          <div>Gender: <span style={{ color: '#4fc3f7' }}>{quietZone.gender ?? '—'}</span> ({Math.round((quietZone.genderProbability) * 100)}% confidence)</div>
          <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>
            Nationalities: {quietZone.countries.slice(0, 5).map(c =>
              `${c.code} (${Math.round(c.probability * 100)}%)`
            ).join(', ')}
          </div>
          <div style={{ marginTop: 4, color: 'rgba(255,255,255,0.3)', fontSize: 9 }}>
            Data: agify.io · genderize.io · nationalize.io (predicted)
          </div>
        </div>
      )}
    </>
  );
}
