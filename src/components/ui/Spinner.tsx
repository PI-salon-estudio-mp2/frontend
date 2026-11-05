/** Indicador de carga. Es decorativo: el texto de estado lo acompaña siempre. */
export function Spinner({ className = 'size-6' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin text-primary-600 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
