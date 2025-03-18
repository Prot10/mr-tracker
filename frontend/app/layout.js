import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Mr Tracker",
  description: "Il tuo gestionale finanziario personale",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="bg-gray-900 text-white">
        <header className="bg-gray-800 shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Logo: puoi sostituirlo con un'immagine se preferisci */}
              <div className="bg-blue-600 rounded-full h-8 w-8 flex items-center justify-center">
                <span className="font-bold">MT</span>
              </div>
              <span className="text-xl font-bold">Mr Tracker</span>
            </div>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link href="/dashboard" className="hover:text-blue-400">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/add-transaction" className="hover:text-blue-400">
                    Aggiungi Transazione
                  </Link>
                </li>
                <li>
                  <Link href="/add-investment" className="hover:text-blue-400">
                    Aggiungi Investimento
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-blue-400">
                    Logout
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
