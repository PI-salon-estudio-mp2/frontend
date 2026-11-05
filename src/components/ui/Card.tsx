import type { HTMLAttributes } from 'react';

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-card border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(27,31,59,0.06),0_8px_24px_-12px_rgba(27,31,59,0.12)] sm:p-8 ${className}`}
      {...rest}
    />
  );
}
