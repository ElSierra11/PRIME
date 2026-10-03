/**
 * TabSkeleton — shimmer placeholder que se muestra mientras
 * React.lazy carga el chunk de la pestaña solicitada.
 *
 * Muestra 3 tarjetas apiladas con animación shimmer idéntica
 * a la del sistema de diseño (class `shimmer` definida en index.css).
 * No usa un spinner suelto; el patrón imita la forma real del contenido.
 */
export default function TabSkeleton() {
  return (
    <div
      role="status"
      aria-label="Cargando contenido de la pestaña…"
      className="space-y-5 animate-in fade-in duration-200"
    >
      {/* Top banner skeleton */}
      <div className="bg-surface border border-border rounded-2xl p-5 sm:p-7 space-y-3">
        <div className="shimmer h-4 w-32 rounded-full" />
        <div className="shimmer h-7 w-2/3 rounded-xl" />
        <div className="shimmer h-3 w-full rounded-lg" />
        <div className="shimmer h-3 w-4/5 rounded-lg" />
      </div>

      {/* 2-column grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left card */}
        <div className="bg-surface border border-border rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="shimmer h-5 w-40 rounded-lg" />
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="shimmer h-12 w-24 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="shimmer h-3 w-16 rounded" />
                  <div className="shimmer h-4 w-full rounded" />
                  <div className="shimmer h-3 w-3/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
            <div className="shimmer h-5 w-36 rounded-lg" />
            <div className="shimmer h-32 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <div className="shimmer h-16 rounded-xl" />
              <div className="shimmer h-16 rounded-xl" />
            </div>
          </div>
          <div className="bg-surface border border-border rounded-2xl p-5 space-y-3">
            <div className="shimmer h-4 w-28 rounded-lg" />
            {[1, 2].map((i) => (
              <div key={i} className="shimmer h-12 rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      <span className="sr-only">Cargando…</span>
    </div>
  );
}
