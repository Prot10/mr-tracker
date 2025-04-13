import { Toaster } from "./components/ui/sonner";
import "./globals.css";

export const metadata = {
  title: "Mr Tracker",
  description: "Il tuo gestionale finanziario personale",
};

export default function RootLayout({ children }) {
  return (
    <html lang="it">
      <body className="bg-gray-900 text-white">
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
