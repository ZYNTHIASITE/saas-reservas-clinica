export default function DashboardUI() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow">
        <h2 className="text-2xl font-bold text-gray-800">
          Panel principal
        </h2>
        <p className="text-gray-600 mt-2">
          Aquí verás el resumen de tu clínica.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500">Citas hoy</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">12</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500">Pendientes confirmar</p>
          <p className="text-3xl font-bold text-yellow-500 mt-2">3</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <p className="text-gray-500">Ocupación semanal</p>
          <p className="text-3xl font-bold text-green-600 mt-2">78%</p>
        </div>
      </div>
    </div>
  );
}