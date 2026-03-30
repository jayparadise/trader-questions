import { Plus_Jakarta_Sans, IBM_Plex_Mono, Playfair_Display } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-body-var', display: 'swap' })
const mono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-mono-var', display: 'swap' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-display-var', display: 'swap' })

export const metadata = {
  title: 'Trader Operations Assistant',
  description: 'AI assistant for trading operations procedures',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${jakarta.variable} ${mono.variable} ${playfair.variable}`}>{children}</body>
    </html>
  )
}
