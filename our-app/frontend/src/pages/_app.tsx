import type { AppProps } from 'next/app'
import '@/styles/globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Header />
      <main className="min-h-screen p-4 max-w-7xl mx-auto">
        <Component {...pageProps} />
      </main>
      <Footer />
    </>
  )
}
