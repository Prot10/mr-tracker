import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center px-4 mx-8">
      <div className="max-w-2xl text-center">
        <Image
          src="/mr-tracker.svg"
          alt="Mr Tracker Logo"
          width={400}
          height={400}
          className="mx-auto mb-4"
        />
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          Mr Tracker
        </h1>
        <p className="text-lg md:text-2xl text-neutral-300 mb-8">
          Your personal financial management tool: track expenses, income, and
          investments in a simple and intuitive way.
        </p>
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="md:w-1/4 px-6 py-2 bg-neutral-950 hover:bg-neutral-800 text-white rounded-md text-lg font-medium transition border border-neutral-300"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="md:w-1/4 px-6 py-2 bg-indigo-700 hover:bg-indigo-600 text-white rounded-md text-lg font-medium transition border border-neutral-300"
          >
            Signup
          </Link>
        </div>
      </div>
    </div>
  );
}
