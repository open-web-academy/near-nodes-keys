import { useState } from 'react';
import Link from 'next/link';

export default function Sidebar() {
  // Use internal state only to simplify
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-gray-800 border border-green-400 text-green-400 hover:text-white md:hidden"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
          />
        </svg>
      </button>

      {/* Dark overlay when menu is open on mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar - slides in on mobile, static on desktop */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-800 text-green-400 p-4 border-r-4 border-dotted border-green-400 flex flex-col justify-between transform transition-transform duration-300 md:transform-none ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          <h2 className="text-2xl font-bold mb-8 tracking-[0.15em]">NEAR Nodes Utils</h2>
          <nav className="space-y-6 text-lg">
            <Link
              href="/"
              className="block hover:text-white border border-green-400 p-2 rounded-sm bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Create Node Keys
            </Link>
            <Link
              href="/launch-pool"
              className="block hover:text-white border border-green-400 p-2 rounded-sm bg-gray-700"
              onClick={() => setIsOpen(false)}
            >
              Launch Pool
            </Link>
          </nav>
        </div>
        <footer>
          <p className="text-center text-sm">
            Made with <span className="text-red-500">&lt;3</span> by{' '}
            <a
              href="https://ow.academy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-white"
            >
              Open Web Academy
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}