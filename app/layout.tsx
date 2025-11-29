import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

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
                <nav>TODO - Navabr / Heading</nav>
                <main className='m-auto w-full 2xl:w-1/2 xl:w-2/3 lg:w-2/3 md:w-3/4 sm:w-11/12 px-4 py-8'>
                    {children}
                </main>
            </body>
        </html>
    );
}
