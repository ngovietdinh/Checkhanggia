import { ReactNode } from 'react';

export default function Card({
  children,
  className = '',
  glow = false,
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-canvas-border bg-canvas-surface p-5 transition-shadow ${
        glow ? 'hover:shadow-glow' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
