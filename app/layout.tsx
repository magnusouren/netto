import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next"
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/navbar';
import Image from 'next/image';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'Økonomikalkulator',
    description: 'En enkel økonomikalkulator for privatpersoner',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='en'>
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
            >
                <Navbar />
                <main className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
                    {children}
                </main>
                <footer className='w-full py-8 mt-16 border-t text-center text-sm text-muted-foreground'>
                    <p>
                        © {new Date().getFullYear()} – Laget av{' '}
                        <a
                            href='https://www.magnus.ouren.no'
                            target='_blank'
                            rel='noopener noreferrer'
                            className='underline hover:text-foreground'
                        >
                            Magnus Ouren
                        </a>
                    </p>
                    <p className='mt-2'>Med forbehold om feil og mangler...</p>
                    <div className='mt-4 w-full flex justify-center'>

                        <a href="https://www.buymeacoffee.com/magnusouren" target="_blank">
                            <Image src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me a Coffee" width={120} height={80} />
                        </a>
                    </div>
                </footer>
                <Analytics />
            </body>
        </html>
    );
}
