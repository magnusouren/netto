import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/navbar';

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
                        .
                    </p>
                    <p className='mt-2'>Med forbehold om feil og mangler...</p>
                </footer>
            </body>
        </html>
    );
}
