import type { Metadata, Viewport } from 'next';
import { Caveat, Plus_Jakarta_Sans } from 'next/font/google';

import './globals.css';

const ui = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});
const hand = Caveat({
  subsets: ['latin'],
  variable: '--font-hand',
  display: 'swap',
  weight: ['500', '700'],
});

export const metadata: Metadata = {
  title: { default: 'Dearly pilot', template: '%s · Dearly pilot' },
  description: 'Cards that arrive on time, for everyone who matters to you.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' };

// Applies the remembered theme before first paint so there is no flash.
const themeScript = `try{var t=localStorage.getItem('dearly-theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB" className={`${ui.variable} ${hand.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
