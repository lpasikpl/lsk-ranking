"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedStatCardProps {
  icon: string;
  rawValue: number;
  formattedValue: string;
  unit: string;
  label: string;
  delay?: number;
  isTime?: boolean;
}

function formatTimeFromSeconds(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default function AnimatedStatCard({ icon, rawValue, formattedValue, unit, label, delay = 0, isTime = false }: AnimatedStatCardProps) {
  const [display, setDisplay] = useState(isTime ? "0:00" : "0");
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      const duration = 2000;
      const steps = 80;
      const interval = duration / steps;
      let step = 0;

      const tick = setInterval(() => {
        step++;
        const progress = step / steps;
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = rawValue * eased;

        if (isTime) {
          setDisplay(formatTimeFromSeconds(current));
        } else {
          const rounded = Math.round(current);
          setDisplay(rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0"));
        }

        if (step >= steps) {
          clearInterval(tick);
          setDisplay(formattedValue);
        }
      }, interval);

      return () => clearInterval(tick);
    }, delay);

    return () => clearTimeout(timer);
  }, [visible, rawValue, formattedValue, delay, isTime]);

  return (
    <div ref={ref} className="stat-card glass glass-hover rounded-2xl p-5 relative overflow-hidden">
      <div className="stat-card-glow" />
      <div className="text-2xl mb-3">{icon}</div>
      <div className="text-2xl font-black text-white tabular-nums">{display}</div>
      <div className="text-xs text-gray-500 mt-0.5">{unit}</div>
      <div className="text-xs text-gray-600 mt-1.5 uppercase tracking-wider font-medium">{label}</div>
    </div>
  );
}
