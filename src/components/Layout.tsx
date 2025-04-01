import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import WalletConnection from './WalletConnection';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex">
        {/* New Sidebar Component */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}