import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useWallet } from '../contexts/WalletContext';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { accounts, connect, disconnect, isLoading } = useWallet();

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [router.pathname]);

  const handleNavigation = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const menuItems = [
    { path: '/', label: 'CREATE_NODE_KEYS' },
    { path: '/launch-pool', label: 'LAUNCH_POOL' },
    { path: '/edit-pool', label: 'EDIT_POOL' },
    { path: '/withdraw-rewards', label: 'WITHDRAW_REWARDS' },
    { path: '/ping-validator', label: 'PING_VALIDATOR' },
    { path: '/donate', label: 'DONATE' },
  ];

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-black/80 backdrop-blur-sm border border-green-400/50 text-green-400 hover:text-white hover:bg-black/90 md:hidden transition-all duration-300 rounded-lg"
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

      {/* Dark overlay with blur effect */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-30 md:hidden transition-all duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-40 w-80 bg-black/95 backdrop-blur-md text-green-400 p-6 flex flex-col justify-between transform transition-all duration-300 md:transform-none border-r border-green-400/20 ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Terminal Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-green-500/70 font-mono">NEAR_NODES_UTILS v1.0.0</div>
            </div>
            <div className="border border-green-400/30 p-4 bg-black/50 rounded-lg backdrop-blur-sm">
              <div className="font-mono text-sm">
                <span className="text-green-400">$</span> NEAR_NODES_UTILS
              </div>
            </div>
          </div>

          {/* Wallet Connection */}
          <div className="mb-6 p-4 border border-green-400/30 rounded-lg bg-black/50 backdrop-blur-sm">
            <div className="font-mono text-sm mb-2">
              <span className="text-green-400">$</span> WALLET_STATUS
            </div>
            {accounts.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-green-400/70 break-all">
                  {accounts[0].accountId}
                </div>
                <button
                  onClick={disconnect}
                  className="w-full text-left p-2 font-mono text-xs transition-all duration-200 rounded hover:bg-green-400/5 hover:text-white"
                >
                  <span className="text-green-400">$</span> DISCONNECT
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isLoading}
                className="w-full text-left p-2 font-mono text-xs transition-all duration-200 rounded hover:bg-green-400/5 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-green-400">$</span> {isLoading ? 'CONNECTING...' : 'CONNECT_WALLET'}
              </button>
            )}
          </div>
          
          {/* Navigation Menu */}
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => handleNavigation(item.path)}
                className={`w-full text-left p-3 font-mono text-sm transition-all duration-200 rounded-lg ${
                  router.pathname === item.path 
                    ? 'bg-green-400/10 text-green-400 border-l-2 border-green-400 shadow-lg shadow-green-400/5' 
                    : 'hover:bg-green-400/5 hover:border-l-2 hover:border-green-400/30'
                }`}
              >
                <span className="text-green-400">$</span> {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-6 border-t border-green-400/20">
          <div className="text-center">
            <div className="font-mono text-xs mb-2">
              <span className="text-green-400">$</span> MADE_WITH
              <span className="text-red-500 animate-pulse"> &lt;3 </span>
              BY
            </div>
            <a
              href="https://ow.academy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block font-mono text-sm px-4 py-2 hover:bg-green-400/5 transition-all duration-200 rounded-lg border border-green-400/20 hover:border-green-400/40"
            >
              <span className="text-green-400">$</span> OPEN_WEB_ACADEMY
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}