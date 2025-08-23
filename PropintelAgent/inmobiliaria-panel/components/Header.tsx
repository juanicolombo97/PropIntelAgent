'use client';

import { useState } from 'react';
import { Home, Users, Building2, Calendar, BarChart3, Menu, X } from 'lucide-react';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
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
            <a 
              href="/calendar" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
            >
              <Calendar size={16} className="group-hover:scale-110 transition-transform" />
              Calendario
            </a>
            <a 
              href="/stats" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
            >
              <BarChart3 size={16} className="group-hover:scale-110 transition-transform" />
              Estadísticas
            </a>
          </nav>
          
          {/* Botón móvil */}
          <div className="lg:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        
        {/* Menú móvil */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-slate-200/50">
            <nav className="flex flex-col gap-1 pt-4">
              <a 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
              >
                <Home size={18} className="group-hover:scale-110 transition-transform" />
                Dashboard
              </a>
              <a 
                href="/leads" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
              >
                <Users size={18} className="group-hover:scale-110 transition-transform" />
                Leads
              </a>
              <a 
                href="/properties" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
              >
                <Building2 size={18} className="group-hover:scale-110 transition-transform" />
                Propiedades
              </a>
              <a 
                href="/calendar" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
              >
                <Calendar size={18} className="group-hover:scale-110 transition-transform" />
                Calendario
              </a>
              <a 
                href="/stats" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
              >
                <BarChart3 size={18} className="group-hover:scale-110 transition-transform" />
                Estadísticas
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 