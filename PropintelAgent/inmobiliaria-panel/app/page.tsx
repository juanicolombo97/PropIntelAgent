import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Users, Building2, TrendingUp, MessageSquare, ArrowRight, Sparkles, Target, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-slate-900 mb-8 text-center">
          Panel Inmobiliaria - Estilos Funcionando
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Leads</h2>
            <p className="text-slate-600">Gestiona tus leads de ventas</p>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Ver Leads
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Propiedades</h2>
            <p className="text-slate-600">Administra tu catálogo</p>
            <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Ver Propiedades
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-200">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Dashboard</h2>
            <p className="text-slate-600">Vista general del negocio</p>
            <button className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              Ver Dashboard
            </button>
          </div>
        </div>
        
        <div className="text-center">
          <a 
            href="/test" 
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
          >
            Ir a Página de Prueba
          </a>
        </div>
      </div>
    </div>
  );
}
