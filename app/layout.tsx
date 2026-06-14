import type { Metadata } from 'next';
import { Analytics } from "@vercel/analytics/next"
import { Fraunces, Geist, Geist_Mono, Schibsted_Grotesk } from 'next/font/google';
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

const schibsted = Schibsted_Grotesk({
    variable: '--font-schibsted',
    weight: ['400', '500', '600', '700', '800'],
    subsets: ['latin'],
});

const fraunces = Fraunces({
    variable: '--font-fraunces',
    subsets: ['latin'],
    axes: ['SOFT', 'opsz'],
});

export const metadata: Metadata = {
    metadataBase: new URL('https://netto.ouren.no'),
    title: {
        default: 'Netto. Personlig økonomi og boligkjøp',
        template: '%s · Netto',
    },
    description:
        'Få full oversikt over månedlig økonomi, skatt, lån og boligkjøp. Sammenlign boliger, planlegg bud og se hva du sitter igjen med. Alt lagres lokalt i nettleseren.',
    applicationName: 'Netto',
    keywords: [
        'personlig økonomi',
        'kontantstrøm',
        'boligkjøp',
        'boliglån',
        'skatteberegning',
        'nedbetalingsplan',
        'budplanlegging',
        'egenkapital',
        'norsk økonomikalkulator',
    ],
    authors: [{ name: 'Magnus Ouren', url: 'https://www.magnus.ouren.no' }],
    creator: 'Magnus Ouren',
    openGraph: {
        type: 'website',
        locale: 'nb_NO',
        url: 'https://netto.ouren.no',
        siteName: 'Netto',
        title: 'Netto. Personlig økonomi og boligkjøp',
        description:
            'Få full oversikt over månedlig økonomi, skatt, lån og boligkjøp. Sammenlign boliger, planlegg bud og se hva du sitter igjen med. Alt lagres lokalt i nettleseren.',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Netto. Personlig økonomi og boligkjøp',
        description:
            'Få full oversikt over månedlig økonomi, skatt, lån og boligkjøp.',
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang='nb'>
            <body
                className={`${schibsted.variable} ${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased bg-background text-foreground`}
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
