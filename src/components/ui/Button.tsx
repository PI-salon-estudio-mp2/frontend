import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-xl font-bold whitespace-nowrap ' +
  'transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800',
  secondary:
    'bg-surface text-primary-700 ring-1 ring-inset ring-primary-300 hover:bg-primary-50 active:bg-primary-100',
  ghost: 'text-ink hover:bg-primary-50 active:bg-primary-100',
  danger: 'bg-danger-700 text-white shadow-sm hover:bg-danger-600',
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
