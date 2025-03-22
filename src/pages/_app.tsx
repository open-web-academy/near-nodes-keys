import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Sidebar from '../components/Sidebar';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className="flex min-h-screen font-mono">
      <Sidebar />
      <div className="flex-1 p-8 bg-gradient-to-r from-blue-50 to-gray-100">
        <Component {...pageProps} />
      </div>
    </div>
  );
}