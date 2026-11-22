import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerSecondary';
export type ButtonSize = 'md' | 'sm';

const BASE =
  // cursor-pointer: Tailwind 4 deja los <button> con el cursor normal; los enlaces ya tienen la mano.
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap ' +
  'transition-[color,background-color] duration-150 disabled:cursor-not-allowed disabled:opacity-60 ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-60';
  
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800',
  secondary:
    'bg-surface text-primary-700 ring-1 ring-inset ring-primary-300 hover:bg-primary-50 active:bg-primary-100',
  ghost: 'text-ink hover:bg-primary-50 active:bg-primary-100',
  danger: 'bg-danger-700 text-white shadow-sm hover:bg-danger-600',
  /** Acción destructiva secundaria (por ejemplo «Eliminar» en una tarjeta): contorno rojo. */
  dangerSecondary:
    'bg-surface text-danger-700 ring-1 ring-inset ring-danger-border hover:bg-danger-50 active:bg-danger-50',
};

const SIZES: Record<ButtonSize, string> = {
  md: 'min-h-11 px-5 text-base',
  sm: 'min-h-10 px-4 text-sm',
};

export function buttonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', extra = '') {
  return [BASE, VARIANTS[variant], SIZES[size], extra].filter(Boolean).join(' ');
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant, size, className, type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, size, className)} {...rest} />;
}

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}

/** Enlace con apariencia de botón (para navegar). Para acciones se usa <Button>. */
export function ButtonLink({ variant, size, className, ...rest }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, size, className)} {...rest} />;
}
