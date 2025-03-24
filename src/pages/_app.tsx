import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }: AppProps) {
  // Remove Sidebar from here if it's also in your Layout component
  // const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>NEAR Validator Tools</title>
      </Head>
      <main className="flex-1 overflow-auto">
        <Component {...pageProps} />
      </main>
    </>
  );
}