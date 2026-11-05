import { useEffect } from 'react';
import { APP_NAME } from '../config/app';

/** Título distinto en cada página (WCAG 2.4.2). */
export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
  }, [title]);
}
