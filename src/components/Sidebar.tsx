import Link from 'next/link';

export default function Sidebar() {
  return (
    <div className="h-screen w-64 bg-gray-800 text-green-400 p-4 border-r-4 border-dotted border-green-400 flex flex-col justify-between">
      <div>
        <h2 className="text-2xl font-bold mb-8 tracking-[0.15em]">NEAR Nodes Utils</h2>
        <nav className="space-y-6 text-lg">
          <Link
            href="/"
            className="block hover:text-white border border-green-400 p-2 rounded-sm bg-gray-700"
          >
            Create Node Keys
          </Link>
          <Link
            href="/launch-pool"
            className="block hover:text-white border border-green-400 p-2 rounded-sm bg-gray-700"
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
  );
}