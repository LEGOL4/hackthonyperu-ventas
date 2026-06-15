interface AlertaInactividadProps {
  segundosRestantes: number;
  onContinuar: () => void;
  onCerrarSesion: () => void;
}

export default function AlertaInactividad({
  segundosRestantes,
  onContinuar,
  onCerrarSesion,
}: AlertaInactividadProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
        {/* Ícono de advertencia */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-9 h-9 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-2">
          ¿Sigues ahí?
        </h2>
        <p className="text-gray-500 mb-1">
          Tu sesión cerrará automáticamente por inactividad en:
        </p>
        <p className="text-4xl font-extrabold text-red-500 my-4">
          {segundosRestantes}s
        </p>
        <p className="text-sm text-gray-400 mb-6">
          Si deseas continuar, haz clic en el botón.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCerrarSesion}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition text-sm font-medium"
          >
            Cerrar sesión
          </button>
          <button
            onClick={onContinuar}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition text-sm font-bold"
          >
            Continuar sesión
          </button>
        </div>
      </div>
    </div>
  );
}