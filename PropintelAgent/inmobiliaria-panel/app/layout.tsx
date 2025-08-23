export const metadata = { title: "Panel Inmobiliaria" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 flex gap-6">
            <a href="/" className="font-semibold">Panel</a>
            <nav className="flex gap-4 text-sm">
              <a href="/leads" className="hover:underline">Leads</a>
              <a href="/properties" className="hover:underline">Propiedades</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
