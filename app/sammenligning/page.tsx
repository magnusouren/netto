'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyP } from '@/components/typography/typographyP';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import useStore, { StoreState } from '@/lib/store';
import { formatNumberToNOK, cn } from '@/lib/utils';
import {
    computeHouseMetrics,
    type HouseMetrics,
} from '@/lib/houseComparison';

const fmt = (n: number) => formatNumberToNOK(Math.round(n));
const fmtPct = (n: number) => `${n.toFixed(2)} %`;
const fmtYears = (n: number) => `${n} år`;

type Direction = 'higher' | 'lower' | 'neutral';

type Row = {
    label: string;
    pick: (m: HouseMetrics) => number;
    format: (n: number) => string;
    direction: Direction;
};

type Group = { title: string; rows: Row[] };

const groups: Group[] = [
    {
        title: 'Kjøp',
        rows: [
            { label: 'Kjøpesum', pick: (m) => m.price, format: fmt, direction: 'lower' },
            { label: 'Omkostninger', pick: (m) => m.closingCosts, format: fmt, direction: 'lower' },
            { label: 'Fellesgjeld', pick: (m) => m.commonDebt, format: fmt, direction: 'lower' },
            { label: 'Egenkapital brukt', pick: (m) => m.equityUsed, format: fmt, direction: 'neutral' },
            { label: 'Lånebeløp', pick: (m) => m.loanAmount, format: fmt, direction: 'lower' },
        ],
    },
    {
        title: 'Lån',
        rows: [
            { label: 'Rente', pick: (m) => m.interestRate, format: fmtPct, direction: 'lower' },
            { label: 'Løpetid', pick: (m) => m.termYears, format: fmtYears, direction: 'neutral' },
            { label: 'Forventet prisvekst', pick: (m) => m.expectedGrowthPct, format: fmtPct, direction: 'higher' },
        ],
    },
    {
        title: 'Månedlig',
        rows: [
            { label: 'Terminbeløp', pick: (m) => m.housingLoanMonthly, format: fmt, direction: 'lower' },
            { label: 'Faste boligkostnader', pick: (m) => m.housingFixedMonthly, format: fmt, direction: 'lower' },
            { label: 'Sum boligkostnad', pick: (m) => m.housingTotalMonthly, format: fmt, direction: 'lower' },
        ],
    },
    {
        title: 'Månedlig kontantstrøm',
        rows: [
            { label: 'Brutto inntekt', pick: (m) => m.monthlyIncomeGross, format: fmt, direction: 'neutral' },
            { label: 'Skatt', pick: (m) => m.monthlyTax, format: fmt, direction: 'lower' },
            { label: 'Netto inntekt', pick: (m) => m.monthlyIncomeNet, format: fmt, direction: 'higher' },
            { label: 'Personlige faste utgifter', pick: (m) => m.monthlyPersonalFixed, format: fmt, direction: 'neutral' },
            { label: 'Variable kostnader', pick: (m) => m.monthlyLivingCosts, format: fmt, direction: 'neutral' },
            { label: 'Personlige lån', pick: (m) => m.monthlyPersonalLoans, format: fmt, direction: 'neutral' },
            { label: 'Boligkostnader', pick: (m) => m.housingTotalMonthly, format: fmt, direction: 'lower' },
            { label: 'Disponibelt', pick: (m) => m.monthlyDisposable, format: fmt, direction: 'higher' },
        ],
    },
    {
        title: 'Langsiktig',
        rows: [
            { label: 'EK om 5 år', pick: (m) => m.equityAt5Years, format: fmt, direction: 'higher' },
            { label: 'EK om 10 år', pick: (m) => m.equityAt10Years, format: fmt, direction: 'higher' },
            { label: 'Totale renter (løpetid)', pick: (m) => m.totalInterestOverLifetime, format: fmt, direction: 'lower' },
        ],
    },
];

function bestIndex(values: number[], direction: Direction): number | null {
    if (direction === 'neutral' || values.length < 2) return null;
    const allEqual = values.every((v) => Math.round(v) === Math.round(values[0]));
    if (allEqual) return null;
    let bestIdx = 0;
    for (let i = 1; i < values.length; i++) {
        if (direction === 'higher' ? values[i] > values[bestIdx] : values[i] < values[bestIdx]) {
            bestIdx = i;
        }
    }
    return bestIdx;
}

export default function SammenligningPage() {
    const data = useStore((s: StoreState) => s.data);
    const houses = useMemo(() => data.houses || [], [data.houses]);

    const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(houses.map((h) => [h.id, true]))
    );

    const selectedHouses = useMemo(
        () => houses.filter((h) => selectedIds[h.id] !== false),
        [houses, selectedIds]
    );

    const metrics = useMemo(
        () => selectedHouses.map((h) => computeHouseMetrics(data, h)),
        [data, selectedHouses]
    );

    const toggle = (id: string) =>
        setSelectedIds((prev) => ({ ...prev, [id]: prev[id] === false }));

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showRightShadow, setShowRightShadow] = useState(false);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const check = () => {
            setShowRightShadow(
                el.scrollWidth - el.clientWidth - el.scrollLeft > 1
            );
        };
        check();
        el.addEventListener('scroll', check, { passive: true });
        window.addEventListener('resize', check);
        return () => {
            el.removeEventListener('scroll', check);
            window.removeEventListener('resize', check);
        };
    }, [metrics.length]);

    return (
        <>
            <div className='container my-8 min-h-24'>
                <TypographyH1>Sammenligning</TypographyH1>
                <TypographyP>
                    Sammenlign boligene dine side ved side på pris, månedlige
                    kostnader, skatt og forventet egenkapital. Beste verdi i hver
                    rad er uthevet.
                </TypographyP>
            </div>

            <section className='container'>
                {houses.length < 2 && (
                    <TypographyP>
                        Du må ha minst to boliger registrert for å sammenligne.
                        Legg til flere boliger på Boliger-siden.
                    </TypographyP>
                )}

                {houses.length >= 2 && (
                    <>
                        <div className='my-4 flex flex-wrap gap-3'>
                            {houses.map((h) => {
                                const checked = selectedIds[h.id] !== false;
                                const isActive = h.id === data.activeHouseId;
                                return (
                                    <label
                                        key={h.id}
                                        className='flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted/40'
                                    >
                                        <Checkbox
                                            checked={checked}
                                            onCheckedChange={() => toggle(h.id)}
                                        />
                                        <span className='text-sm'>{h.name}</span>
                                        {isActive && (
                                            <span className='text-[10px] font-mono uppercase tracking-wider text-muted-foreground'>
                                                Aktiv
                                            </span>
                                        )}
                                    </label>
                                );
                            })}
                        </div>

                        {selectedHouses.length < 2 && (
                            <TypographyP>
                                Velg minst to boliger over for å se sammenligning.
                            </TypographyP>
                        )}

                        {selectedHouses.length >= 2 && (
                            <div className='relative my-4'>
                                <div
                                    ref={scrollRef}
                                    className='overflow-auto border rounded-md'
                                >
                                    <table className='w-full table-auto text-sm border-collapse'>
                                        <thead className='sticky top-0 z-10 bg-muted'>
                                            <tr>
                                                <th className='sticky left-0 z-[11] bg-muted p-2 text-left border-r border-border'>
                                                    <Label className='text-[10px] uppercase tracking-wider text-muted-foreground'>
                                                        Metrikk
                                                    </Label>
                                                </th>
                                                {metrics.map((m) => (
                                                    <th
                                                        key={m.houseId}
                                                        className='p-2 text-right font-semibold'
                                                    >
                                                        <div className='flex items-center justify-end gap-2'>
                                                            {m.houseName}
                                                            {m.houseId ===
                                                                data.activeHouseId && (
                                                                <span className='text-[10px] font-mono uppercase tracking-wider text-muted-foreground'>
                                                                    Aktiv
                                                                </span>
                                                            )}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groups.map((group) => (
                                                <GroupRows
                                                    key={group.title}
                                                    group={group}
                                                    metrics={metrics}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                <div
                                    aria-hidden
                                    className={cn(
                                        'pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent rounded-r-md transition-opacity',
                                        showRightShadow
                                            ? 'opacity-100'
                                            : 'opacity-0'
                                    )}
                                />
                            </div>
                        )}
                    </>
                )}
            </section>
        </>
    );
}

function GroupRows({
    group,
    metrics,
}: {
    group: Group;
    metrics: HouseMetrics[];
}) {
    return (
        <>
            <tr className='bg-muted/40'>
                <td colSpan={metrics.length + 1} className='p-0'>
                    <div className='sticky left-0 px-2 py-1.5 text-[10px] font-mono uppercase tracking-wider text-muted-foreground'>
                        {group.title}
                    </div>
                </td>
            </tr>
            {group.rows.map((row) => {
                const values = metrics.map(row.pick);
                const best = bestIndex(values, row.direction);
                return (
                    <tr key={row.label} className='border-b'>
                        <td className='sticky left-0 z-[1] bg-background p-2 text-foreground/80 border-r border-border'>
                            {row.label}
                        </td>
                        {values.map((value, i) => (
                            <td
                                key={metrics[i].houseId}
                                className={cn(
                                    'p-2 text-right tabular-nums font-mono',
                                    best === i &&
                                        'bg-emerald-50 text-emerald-700 font-semibold'
                                )}
                            >
                                {row.format(value)}
                            </td>
                        ))}
                    </tr>
                );
            })}
        </>
    );
}
