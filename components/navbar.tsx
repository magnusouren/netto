'use client';

import Link from 'next/link';

export default function Navbar() {
    return (
        <header className='sticky top-0 z-40 bg-white/75 backdrop-blur-md border-b border-muted/20'>
            <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex items-center justify-between h-16'>
                    <div className='flex items-center gap-3'>
                        <div className='text-lg sm:text-2xl font-semibold text-brandBlue'>
                            <Link href='/'>NETTO</Link>
                        </div>
                    </div>
                    <div>
                        <nav className='flex items-center gap-4'>
                            <Link
                                href='/data'
                                className='text-sm font-medium text-foreground/70 hover:text-foreground'
                            >
                                Grunnlagsdata
                            </Link>
                            <Link
                                href='/tax'
                                className='text-sm font-medium text-foreground/70 hover:text-foreground'
                            >
                                Skattedetaljer
                            </Link>
                            <Link
                                href='/loan'
                                className='text-sm font-medium text-foreground/70 hover:text-foreground'
                            >
                                Nedbetalingsplaner
                            </Link>
                            <Link
                                href='/plan'
                                className='text-sm font-medium text-foreground/70 hover:text-foreground'
                            >
                                Egenkapitalutvikling
                            </Link>
                            <Link
                                href='/paymentPlan'
                                className='text-sm font-medium text-foreground/70 hover:text-foreground'
                            >
                                Månedlig økonomi
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    );
}
