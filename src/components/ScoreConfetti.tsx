import { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  color: string;
  delay: number;
  duration: number;
  size: number;
}

const COLORS = ['#22c55e', '#16a34a', '#86efac', '#4ade80', '#bbf7d0'];
const CONFETTI_KEY_PREFIX = 'sentio_confetti_';

interface ScoreConfettiProps {
  accountId: string;
  score: number;
  isNew: boolean;
}

export default function ScoreConfetti({ accountId, score, isNew }: ScoreConfettiProps) {
  const storageKey = `${CONFETTI_KEY_PREFIX}${accountId}`;
  const [particles, setParticles] = useState<Particle[]>([]);
  const fired = useRef(false);

  useEffect(() => {
    if (!isNew || score <= 90 || fired.current) return;
    if (sessionStorage.getItem(storageKey)) return;

    fired.current = true;
    sessionStorage.setItem(storageKey, '1');

    const ps: Particle[] = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 10 + i * 14,
      color: COLORS[i % COLORS.length],
      delay: i * 80,
      duration: 800 + Math.random() * 400,
      size: 6 + Math.random() * 4,
    }));
    setParticles(ps);

    setTimeout(() => setParticles([]), 2000);
  }, [isNew, score, storageKey]);

  if (particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-full">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: '50%',
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}ms ease-in forwards`,
            animationDelay: `${p.delay}ms`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-60px) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
