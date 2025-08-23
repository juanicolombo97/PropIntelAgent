export default function TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-slate-900 mb-8">Página de Prueba - Estilos</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Card 1</h2>
            <p className="text-slate-600">Esta es una tarjeta de prueba con estilos de Tailwind.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Card 2</h2>
            <p className="text-slate-600">Otra tarjeta para verificar que los estilos funcionen.</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Card 3</h2>
            <p className="text-slate-600">Tercera tarjeta de prueba.</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-md transition-all duration-200">
            Botón con Gradiente
          </button>
          
          <button className="bg-white text-slate-700 border border-slate-300 px-6 py-3 rounded-xl font-medium hover:bg-slate-50 transition-all duration-200 ml-4">
            Botón Secundario
          </button>
        </div>
        
        <div className="mt-8 p-6 bg-slate-50 rounded-xl">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Información de Estilos</h3>
          <ul className="space-y-2 text-slate-600">
            <li>• Tailwind CSS está configurado</li>
            <li>• Gradientes funcionando</li>
            <li>• Sombras y bordes redondeados</li>
            <li>• Transiciones suaves</li>
            <li>• Colores slate para texto</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 