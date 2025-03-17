import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Mr Tracker
        </h1>
        <p className="text-lg md:text-2xl text-gray-300 mb-8">
          Il tuo gestionale finanziario personale: traccia spese, entrate e
          investimenti in modo semplice e intuitivo.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-lg font-medium transition"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-md text-lg font-medium transition"
          >
            Signup
          </Link>
        </div>
      </div>
    </div>
  );
}
