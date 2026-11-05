import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const TONES: Record<AlertTone, { box: string; icon: IconName; iconColor: string }> = {
  info: { box: 'bg-primary-50 border-primary-200', icon: 'compass', iconColor: 'text-primary-700' },
  success: { box: 'bg-success-50 border-success-700/30', icon: 'check', iconColor: 'text-success-700' },
  warning: { box: 'bg-warning-50 border-warning-700/30', icon: 'clock', iconColor: 'text-warning-700' },
  danger: { box: 'bg-danger-50 border-danger-700/30', icon: 'alert', iconColor: 'text-danger-700' },
};

interface AlertProps {
  tone?: AlertTone;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}

/**
 * Mensaje de retroalimentación. No lleva role="alert": los anuncios al lector
 * de pantalla se hacen desde una región viva persistente para no duplicarlos.
 */
export function Alert({ tone = 'info', title, children, actions }: AlertProps) {
  const t = TONES[tone];
  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${t.box}`}>
      <Icon name={t.icon} className={`mt-0.5 size-5 shrink-0 ${t.iconColor}`} />
      <div className="min-w-0 flex-1">
        <p className="font-bold text-ink">{title}</p>
        {children && <div className="mt-1 text-muted">{children}</div>}
        {actions && <div className="mt-4 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
}
