import './globals.css';
import { Home, Users, Building2, Menu } from 'lucide-react';

export const metadata = { 
  title: "Panel Inmobiliaria",
  description: "Panel de administración para gestión de leads y propiedades"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Header moderno */}
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo */}
              <a href="/" className="flex items-center gap-3 group">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300">
                  <Building2 size={24} className="text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    PropIntel
                  </h1>
                  <p className="text-xs text-slate-500 -mt-1">Panel Administrativo</p>
                </div>
              </a>
              
              {/* Navegación desktop */}
              <nav className="hidden lg:flex items-center gap-1">
                <a 
                  href="/" 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
                >
                  <Home size={16} className="group-hover:scale-110 transition-transform" />
                  Dashboard
                </a>
                <a 
                  href="/leads" 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
                >
                  <Users size={16} className="group-hover:scale-110 transition-transform" />
                  Leads
                </a>
                <a 
                  href="/properties" 
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
                >
                  <Building2 size={16} className="group-hover:scale-110 transition-transform" />
                  Propiedades
                </a>
              </nav>
              
              {/* Botón móvil */}
              <div className="lg:hidden">
                <button className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200">
                  <Menu size={24} />
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Contenido principal */}
        <main className="max-w-7xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
