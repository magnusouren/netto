'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <header className='sticky top-0 z-40 bg-white/75 backdrop-blur-md border-b border-muted/20'>
            <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex items-center justify-between h-16'>
                    {/* Logo */}
                    <div className='text-lg sm:text-2xl font-semibold text-brandBlue'>
                        <Link href='/'>NETTO</Link>
                    </div>

                    {/* Desktop nav */}
                    <nav className='hidden sm:flex items-center gap-4'>
                        <NavLinks />
                    </nav>

                    {/* Mobile hamburger */}
                    <button
                        className='sm:hidden p-2 rounded-md hover:bg-muted/20'
                        onClick={() => setOpen(!open)}
                        aria-label='Toggle Menu'
                    >
                        {open ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Mobile dropdown menu */}
                {open && (
                    <nav className='sm:hidden pb-4 animate-in slide-in-from-top-2 fade-in-0'>
                        <div className='flex flex-col gap-3 mt-2'>
                            <NavLinks onClick={() => setOpen(false)} />
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}

/* Shared nav links */
function NavLinks({ onClick }: { onClick?: () => void }) {
    const pathname = usePathname();

    const linkClass = (href: string) =>
        `text-sm font-medium transition-colors ${
            pathname === href
                ? 'text-foreground underline underline-offset-4'
                : 'text-foreground/70 hover:text-foreground'
        }`;

    return (
        <>
            <Link href='/data' className={linkClass('/data')} onClick={onClick}>
                Grunnlagsdata
            </Link>
            <Link
                href='/houses'
                className={linkClass('/houses')}
                onClick={onClick}
            >
                Boliger
            </Link>
            <Link
                href='/tax-details'
                className={linkClass('/tax-details')}
                onClick={onClick}
            >
                Skattedetaljer
            </Link>
            <Link
                href='/repayment-plans'
                className={linkClass('/repayment-plans')}
                onClick={onClick}
            >
                Nedbetalingsplaner
            </Link>
            <Link
                href='/equity-development'
                className={linkClass('/equity-development')}
                onClick={onClick}
            >
                Egenkapitalutvikling
            </Link>
            <Link
                href='/monthly-economy'
                className={linkClass('/monthly-economy')}
                onClick={onClick}
            >
                Månedlig økonomi
            </Link>
            <Link
                href='/summary'
                className={linkClass('/summary')}
                onClick={onClick}
            >
                Oppsummering
            </Link>
        </>
    );
}
