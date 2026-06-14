'use client';

import { ReactNode, createContext, useContext } from 'react';
import { cn } from '@/lib/utils';
import { LabelMono } from './LabelMono';

type Density = 'default' | 'compact';

const DensityContext = createContext<Density>('default');

function useDensity() {
    return useContext(DensityContext);
}

/**
 * Glance — the "receipt" pattern. Used on the landing page to summarise
 * the current month's numbers as a side panel. Visual signature is the
 * dotted edges (top and bottom) that mimic a torn ticket.
 *
 *   <Glance title="Husholdning Nordmann" subtitle="Din måned · mai 2026">
 *     <Glance.Row label="Brutto inntekt" value="+ 116 667" />
 *     <Glance.Row label="Skatt og avgift" value="− 34 521" />
 *     …
 *     <Glance.Total label="Kontantstrøm" value="18 596" />
 *   </Glance>
 *
 * Pass `density="compact"` for tight, scannable receipts (long breakdowns
 * like /tax-details). Children (`Row`, `Total`, `Section`) inherit it.
 */
function Glance({
    title,
    subtitle,
    indexLabel,
    children,
    footnote,
    className,
    density = 'default',
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    indexLabel?: ReactNode;
    children?: ReactNode;
    /** Optional bottom strip ("+ 13 240 i egenkapital" kind of thing). */
    footnote?: ReactNode;
    className?: string;
    density?: Density;
}) {
    const isCompact = density === 'compact';
    return (
        <DensityContext.Provider value={density}>
            <div
                className={cn(
                    // Dotted top + bottom edges via two absolutely positioned
                    // overlays. Keeps it crisp at any width.
                    'relative bg-card border border-border isolate',
                    isCompact ? 'px-6 py-5' : 'px-9 py-8',
                    'before:content-[""] before:absolute before:left-0 before:right-0 before:-top-px before:h-2 before:[background-image:radial-gradient(circle_at_6px_0,var(--background)_4px,transparent_4.2px)] before:[background-size:12px_8px] before:[background-repeat:repeat-x] before:[transform:scaleY(-1)]',
                    'after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-px after:h-2 after:[background-image:radial-gradient(circle_at_6px_0,var(--background)_4px,transparent_4.2px)] after:[background-size:12px_8px] after:[background-repeat:repeat-x]',
                    className
                )}
            >
                <div
                    className={cn(
                        'flex justify-between items-baseline',
                        isCompact ? 'mb-3' : 'mb-5'
                    )}
                >
                    <div>
                        {subtitle && (
                            <LabelMono className='text-[10px]'>{subtitle}</LabelMono>
                        )}
                        <div
                            className={cn(
                                'font-serif font-normal tracking-tight leading-none',
                                isCompact ? 'text-xl mt-0.5' : 'text-2xl mt-1'
                            )}
                        >
                            {title}
                        </div>
                    </div>
                    {indexLabel && (
                        <LabelMono className='text-[10px]'>{indexLabel}</LabelMono>
                    )}
                </div>
                {children && <div className='grid gap-0'>{children}</div>}
                {footnote && (
                    <div
                        className={cn(
                            'flex justify-between text-[11.5px] text-muted-foreground',
                            isCompact ? 'mt-3' : 'mt-5'
                        )}
                    >
                        {footnote}
                    </div>
                )}
            </div>
        </DensityContext.Provider>
    );
}

function Row({
    label,
    value,
}: {
    label: ReactNode;
    value: ReactNode;
}) {
    const isCompact = useDensity() === 'compact';
    return (
        <div
            className={cn(
                'flex items-baseline justify-between gap-2 border-b border-border/60 last:border-b-0',
                isCompact ? 'py-1.5' : 'py-3.5'
            )}
        >
            <span className='min-w-0 truncate text-xs text-foreground/80'>{label}</span>
            <span
                className={cn(
                    'shrink-0 whitespace-nowrap font-mono tabular-nums',
                    isCompact ? 'text-[13px]' : 'text-base'
                )}
            >
                {value}
            </span>
        </div>
    );
}

function Total({
    label,
    value,
}: {
    label: ReactNode;
    value: ReactNode;
}) {
    const isCompact = useDensity() === 'compact';
    return (
        <div
            className={cn(
                'flex items-baseline justify-between gap-2 border-t border-foreground',
                isCompact ? 'pt-2.5 mt-1' : 'pt-4'
            )}
        >
            <span className='min-w-0 truncate text-sm font-semibold'>{label}</span>
            <span
                className={cn(
                    'shrink-0 whitespace-nowrap font-serif font-normal leading-none tracking-tight',
                    isCompact ? 'text-2xl' : 'text-3xl'
                )}
            >
                {value}
            </span>
        </div>
    );
}

function Section({ children }: { children: ReactNode }) {
    const isCompact = useDensity() === 'compact';
    return (
        <div className={isCompact ? 'pt-2 pb-1 first:pt-1' : 'pt-4 pb-2 first:pt-2'}>
            <LabelMono className='text-[10px]'>{children}</LabelMono>
        </div>
    );
}

Glance.Row = Row;
Glance.Total = Total;
Glance.Section = Section;

export { Glance };
