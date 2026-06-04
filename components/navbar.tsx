'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, ChevronDown, Menu, Share2, X } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import useStore, { StoreState } from '@/lib/store';
import { buildShareUrl, isDataEmpty } from '@/lib/share';

type NavItem = { href: string; label: string };
type NavGroup = { label: string; items: NavItem[] };

const groups: NavGroup[] = [
    {
        label: 'Grunnlag',
        items: [
            { href: '/data', label: 'Inntekter og utgifter' },
            { href: '/houses', label: 'Boliger' },
        ],
    },
    {
        label: 'Analyser',
        items: [
            { href: '/tax-details', label: 'Skatt' },
            { href: '/repayment-plans', label: 'Nedbetaling' },
            { href: '/equity-development', label: 'Egenkapital' },
            { href: '/monthly-economy', label: 'Månedlig' },
            { href: '/interest-sensitivity', label: 'Rentefølsomhet' },
            { href: '/sammenligning', label: 'Boligsammenligning' },
            { href: '/bid-planning', label: 'Budplanlegging' },
        ],
    },
];

const standalone: NavItem = { href: '/summary', label: 'Oppsummering' };

export default function Navbar() {
    const [open, setOpen] = useState(false);

    return (
        <header className='sticky top-0 z-40 backdrop-blur-md border-b bg-background/75 border-b-border'>
            <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 '>
                <div className='flex items-center justify-between h-16'>
                    {/* Logo */}
                    <div className='text-lg sm:text-2xl font-semibold text-brandBlue'>
                        <Link href='/' className='group inline-flex items-baseline'>
                            Netto<span className='text-brandOrange'>.</span>
                            <span
                                aria-hidden='true'
                                className='inline-block overflow-hidden whitespace-nowrap text-brandOrange max-w-0 group-hover:max-w-[9ch] transition-[max-width] duration-700 [transition-timing-function:steps(8)]'
                            >
                                ouren.no
                            </span>
                        </Link>
                    </div>

                    {/* Desktop nav */}
                    <nav className='hidden sm:flex items-center gap-4'>
                        <DesktopNavLinks />
                        <ShareButton />
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
                    <nav className='sm:hidden pb-4 animate-in slide-in-from-top-2 fade-in-0 bg-background'>
                        <div className='flex flex-col gap-1 mt-2'>
                            <MobileNavLinks onNavigate={() => setOpen(false)} />
                            <div className='pt-2 mt-1 border-t border-border'>
                                <ShareButton fullWidth />
                            </div>
                        </div>
                    </nav>
                )}
            </div>
        </header>
    );
}

function DesktopNavLinks() {
    const pathname = usePathname();

    return (
        <>
            {groups.map((group) => (
                <NavGroupPopover
                    key={group.label}
                    group={group}
                    pathname={pathname}
                />
            ))}
            <Link
                href={standalone.href}
                className={linkClass(pathname === standalone.href)}
            >
                {standalone.label}
            </Link>
        </>
    );
}

function NavGroupPopover({
    group,
    pathname,
}: {
    group: NavGroup;
    pathname: string;
}) {
    const [open, setOpen] = useState(false);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const groupActive = group.items.some((item) => item.href === pathname);

    const cancelClose = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    };

    const scheduleClose = () => {
        cancelClose();
        closeTimer.current = setTimeout(() => setOpen(false), 120);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    onMouseEnter={() => {
                        cancelClose();
                        setOpen(true);
                    }}
                    onMouseLeave={scheduleClose}
                    onFocus={() => {
                        cancelClose();
                        setOpen(true);
                    }}
                    className={`flex items-center gap-1 text-sm font-medium transition-colors ${groupActive
                        ? 'text-foreground'
                        : 'text-foreground/70 hover:text-foreground'
                        }`}
                >
                    {group.label}
                    <ChevronDown
                        size={14}
                        className={`transition-transform ${open ? 'rotate-180' : ''
                            }`}
                    />
                </button>
            </PopoverTrigger>
            <PopoverContent
                align='start'
                sideOffset={8}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
                onOpenAutoFocus={(e) => e.preventDefault()}
                className='w-56 p-2'
            >
                <div className='flex flex-col'>
                    {group.items.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setOpen(false)}
                                className={`px-2 py-1.5 rounded-sm text-sm transition-colors ${active
                                    ? 'bg-muted text-foreground'
                                    : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </PopoverContent>
        </Popover>
    );
}

function MobileNavLinks({ onNavigate }: { onNavigate: () => void }) {
    const pathname = usePathname();

    return (
        <>
            {groups.map((group) => (
                <MobileNavGroup
                    key={group.label}
                    group={group}
                    pathname={pathname}
                    onNavigate={onNavigate}
                />
            ))}
            <Link
                href={standalone.href}
                onClick={onNavigate}
                className={`py-2 ${linkClass(pathname === standalone.href)}`}
            >
                {standalone.label}
            </Link>
        </>
    );
}

function MobileNavGroup({
    group,
    pathname,
    onNavigate,
}: {
    group: NavGroup;
    pathname: string;
    onNavigate: () => void;
}) {
    const groupActive = group.items.some((item) => item.href === pathname);
    const [expanded, setExpanded] = useState(groupActive);

    return (
        <div className='flex flex-col'>
            <button
                onClick={() => setExpanded(!expanded)}
                className={`flex items-center justify-between py-2 text-sm font-medium transition-colors ${groupActive
                    ? 'text-foreground'
                    : 'text-foreground/70 hover:text-foreground'
                    }`}
            >
                <span>{group.label}</span>
                <ChevronDown
                    size={16}
                    className={`transition-transform ${expanded ? 'rotate-180' : ''
                        }`}
                />
            </button>
            {expanded && (
                <div className='flex flex-col gap-1 pl-3 pb-1 border-l border-border ml-1'>
                    {group.items.map((item) => {
                        const active = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                className={`py-1.5 text-sm ${active
                                    ? 'text-foreground underline underline-offset-4'
                                    : 'text-foreground/70 hover:text-foreground'
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function linkClass(active: boolean) {
    return `text-sm font-medium transition-colors ${active
        ? 'text-foreground underline underline-offset-4'
        : 'text-foreground/70 hover:text-foreground'
        }`;
}

function ShareButton({ fullWidth = false }: { fullWidth?: boolean }) {
    const data = useStore((s: StoreState) => s.data);
    const hasHydrated = useStore((s: StoreState) => s._hasHydrated);
    const [status, setStatus] = useState<'idle' | 'copied' | 'empty'>('idle');

    const handleClick = async () => {
        if (!hasHydrated) return;
        if (isDataEmpty(data)) {
            setStatus('empty');
            setTimeout(() => setStatus('idle'), 1800);
            return;
        }
        try {
            await navigator.clipboard.writeText(buildShareUrl(data));
            setStatus('copied');
            setTimeout(() => setStatus('idle'), 1800);
        } catch {
            // Clipboard unavailable — leave status idle.
        }
    };

    const label =
        status === 'copied'
            ? 'Lenke kopiert'
            : status === 'empty'
                ? 'Ingen data å dele'
                : 'Del';

    const Icon = status === 'copied' ? Check : Share2;

    return (
        <button
            onClick={handleClick}
            className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors text-foreground/70 hover:text-foreground ${fullWidth ? 'w-full justify-start py-2' : ''
                }`}
            aria-label='Del dine data via lenke'
        >
            <Icon size={14} />
            {label}
        </button>
    );
}
