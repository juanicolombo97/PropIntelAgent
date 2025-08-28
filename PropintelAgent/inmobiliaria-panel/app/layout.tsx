import './globals.css';
import { Header } from '@/components/Header';
import { LoadingOverlay } from '@/components/ui/LoadingOverlay';
import { LoadingProvider } from '@/components/LoadingProvider';
import { Providers } from '@/components/Providers';
import { DataInitializer } from '@/components/DataInitializer';
import { ClientOnly } from '@/components/ClientOnly';

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
        <Providers>
          <LoadingProvider>
            <ClientOnly>
              <DataInitializer />
            </ClientOnly>
            <Header />
            
            {/* Contenido principal */}
            <main className="max-w-7xl mx-auto px-4 py-8">
              {children}
            </main>
            
            {/* Loading overlay global */}
            <LoadingOverlay />
          </LoadingProvider>
        </Providers>
      </body>
    </html>
  );
}
