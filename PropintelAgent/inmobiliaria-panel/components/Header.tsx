'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, Users, Building2, Calendar, BarChart3, Menu, X, LogOut, User, MessageCircle } from 'lucide-react';
import { useAuth } from '@/lib/useAuth';
import { Button } from '@/components/ui/Button';

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-md group-hover:shadow-lg transition-all duration-300">
              <Building2 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PropIntel
              </h1>
              <p className="text-xs text-slate-500 -mt-1">Panel Administrativo</p>
            </div>
          </Link>
          
          {/* Navegación desktop */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link 
              href="/" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
            >
              <Home size={16} className="group-hover:scale-110 transition-transform" />
              Dashboard
            </Link>
            <Link 
              href="/leads" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
            >
              <Users size={16} className="group-hover:scale-110 transition-transform" />
              Leads
            </Link>
            <Link 
              href="/properties" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
            >
              <Building2 size={16} className="group-hover:scale-110 transition-transform" />
              Propiedades
            </Link>
            <Link 
              href="/calendar" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
            >
              <Calendar size={16} className="group-hover:scale-110 transition-transform" />
              Calendario
            </Link>
            <Link 
              href="/stats" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
            >
              <BarChart3 size={16} className="group-hover:scale-110 transition-transform" />
              Estadísticas
            </Link>
            <Link 
              href="/bot-simulator" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
            >
              <MessageCircle size={16} className="group-hover:scale-110 transition-transform" />
              Bot Simulator
            </Link>
          </nav>
          
          {/* Menú de usuario */}
          <div className="hidden lg:flex items-center gap-4">
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200"
              >
                <User size={16} />
                <span>{user?.username}</span>
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-slate-200">
                    <p className="text-xs text-slate-500">Conectado como</p>
                    <p className="text-sm font-medium text-slate-900">{user?.username}</p>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-all duration-200"
                  >
                    <LogOut size={16} />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
          
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
              <Link 
                href="/" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
              >
                <Home size={18} className="group-hover:scale-110 transition-transform" />
                Dashboard
              </Link>
              <Link 
                href="/leads" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
              >
                <Users size={18} className="group-hover:scale-110 transition-transform" />
                Leads
              </Link>
              <Link 
                href="/properties" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
              >
                <Building2 size={18} className="group-hover:scale-110 transition-transform" />
                Propiedades
              </Link>
              <Link 
                href="/calendar" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
              >
                <Calendar size={18} className="group-hover:scale-110 transition-transform" />
                Calendario
              </Link>
              <Link 
                href="/stats" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
              >
                <BarChart3 size={18} className="group-hover:scale-110 transition-transform" />
                Estadísticas
              </Link>
              <Link 
                href="/bot-simulator" 
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-white/50 transition-all duration-200 group"
              >
                <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
                Bot Simulator
              </Link>
              
              {/* Información de usuario y logout en móvil */}
              <div className="border-t border-slate-200/50 mt-2 pt-2">
                <div className="px-4 py-2">
                  <p className="text-xs text-slate-500">Conectado como</p>
                  <p className="text-sm font-medium text-slate-900">{user?.username}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:text-red-800 hover:bg-red-50 transition-all duration-200"
                >
                  <LogOut size={18} />
                  Cerrar Sesión
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
} 