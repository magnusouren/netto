import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LabelMono } from './LabelMono';

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
 */
function Glance({
    title,
    subtitle,
    indexLabel,
    children,
    footnote,
    className,
}: {
    title: ReactNode;
    subtitle?: ReactNode;
    indexLabel?: ReactNode;
    children: ReactNode;
    /** Optional bottom strip ("+ 13 240 i egenkapital" kind of thing). */
    footnote?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                // Dotted top + bottom edges via two absolutely positioned
                // overlays. Keeps it crisp at any width.
                'relative bg-card border border-border px-9 py-8 isolate',
                'before:content-[""] before:absolute before:left-0 before:right-0 before:-top-px before:h-2 before:[background-image:radial-gradient(circle_at_6px_0,var(--background)_4px,transparent_4.2px)] before:[background-size:12px_8px] before:[background-repeat:repeat-x] before:[transform:scaleY(-1)]',
                'after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-px after:h-2 after:[background-image:radial-gradient(circle_at_6px_0,var(--background)_4px,transparent_4.2px)] after:[background-size:12px_8px] after:[background-repeat:repeat-x]',
                className
            )}
        >
            <div className='flex justify-between items-baseline mb-5'>
                <div>
                    {subtitle && (
                        <LabelMono className='text-[10px]'>{subtitle}</LabelMono>
                    )}
                    <div className='font-serif font-normal text-2xl tracking-tight mt-1 leading-none'>
                        {title}
                    </div>
                </div>
                {indexLabel && (
                    <LabelMono className='text-[10px]'>{indexLabel}</LabelMono>
                )}
            </div>
            <div className='grid gap-0'>{children}</div>
            {footnote && (
                <div className='flex justify-between mt-5 text-[11.5px] text-muted-foreground'>
                    {footnote}
                </div>
            )}
        </div>
    );
}

function Row({
    label,
    value,
}: {
    label: ReactNode;
    value: ReactNode;
}) {
    return (
        <div className='grid grid-cols-[1fr_auto] items-baseline py-3.5 border-b border-border/60 last:border-b-0'>
            <span className='text-xs text-foreground/80'>{label}</span>
            <span className='font-mono tabular-nums text-base'>{value}</span>
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
    return (
        <div className='grid grid-cols-[1fr_auto] items-baseline pt-4 border-t border-foreground'>
            <span className='text-sm font-semibold'>{label}</span>
            <span className='font-serif font-normal text-3xl leading-none tracking-tight'>
                {value}
            </span>
        </div>
    );
}

Glance.Row = Row;
Glance.Total = Total;

export { Glance };
