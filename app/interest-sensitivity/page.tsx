'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';
import { Button } from '@/components/ui/button';
import useStore, { StoreState } from '@/lib/store';
import { formatNumberToNOK } from '@/lib/utils';
import {
    INTEREST_DELTAS,
    computeInterestScenarios,
} from '@/lib/interestSensitivity';
import { cn } from '@/lib/utils';
import type { EconomyData } from '@/types';

const RATE_STEP = 0.25;

const fmt = (n: number) => formatNumberToNOK(Math.round(n));

const fmtDelta = (d: number) => {
    if (d === 0) return 'Nå';
    const sign = d > 0 ? '+' : '−';
    return `${sign}${Math.abs(d).toFixed(2)} %`;
};

const fmtSignedNOK = (n: number) => {
    if (Math.round(n) === 0) return fmt(0);
    const sign = n > 0 ? '+' : '−';
    return `${sign} ${fmt(Math.abs(n))}`;
};

const roundRate = (r: number) => Math.round(r * 100) / 100;

export default function InterestSensitivityPage() {
    const data = useStore((s: StoreState) => s.data);

    const personalLoans = useMemo(() => data.loans || [], [data.loans]);
    const originalRates = useMemo(
        () => personalLoans.map((l) => l.interestRate || 0),
        [personalLoans]
    );

    // Per-loan overrides keyed by loan index. Undefined = use original rate.
    const [rateOverrides, setRateOverrides] = useState<
        Record<number, number>
    >({});

    const effectiveRate = (index: number) =>
        rateOverrides[index] ?? originalRates[index] ?? 0;

    const adjustRate = (index: number, delta: number) => {
        setRateOverrides((prev) => ({
            ...prev,
            [index]: Math.max(0, roundRate(effectiveRate(index) + delta)),
        }));
    };

    const resetRates = () => setRateOverrides({});

    const hasOverrides = personalLoans.some(
        (_, i) =>
            rateOverrides[i] !== undefined &&
            rateOverrides[i] !== originalRates[i]
    );

    const adjustedData: EconomyData = useMemo(
        () => ({
            ...data,
            loans: personalLoans.map((loan, i) => ({
                ...loan,
                interestRate: effectiveRate(i),
            })),
        }),
        // effectiveRate is closed over rateOverrides/originalRates
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [data, rateOverrides, originalRates]
    );

    const scenarios = computeInterestScenarios(adjustedData, INTEREST_DELTAS);
    const baseline = scenarios.find((s) => s.delta === 0);

    const activeHousingLoan = (data.houses || []).find(
        (h) => h.id === data.activeHouseId
    )?.housingLoan;
    const currentHousingRate = activeHousingLoan?.interestRate ?? 0;

    const hasHousingLoan =
        !!activeHousingLoan && activeHousingLoan.loanAmount > 0;

    const scrollRef = useRef<HTMLDivElement>(null);
    const [showRightShadow, setShowRightShadow] = useState(false);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !hasHousingLoan) return;
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
    }, [hasHousingLoan, scenarios.length]);

    return (
        <>
            <div className='container my-8 min-h-24'>
                <TypographyH1>Rentefølsomhet</TypographyH1>
                <TypographyP>
                    Hvordan påvirker rentenivået økonomien din? Tabellen viser
                    samlet terminbeløp, rentekostnad og månedlig disponibelt
                    beløp for renteendringer på inntil ±1 prosentpoeng. Endringen
                    gjelder kun boliglånet, og øvrige lån justeres separat under
                    tabellen.
                </TypographyP>
            </div>

            <section className='container'>
                {!hasHousingLoan && (
                    <TypographyP>
                        Du har ikke noe aktivt boliglån. Legg til en bolig med
                        lån for å se rentefølsomhet her.
                    </TypographyP>
                )}

                {hasHousingLoan && (
                    <div className='relative my-4'>
                        <div ref={scrollRef} className='overflow-auto'>
                            <table className='w-full table-auto text-sm border-collapse'>
                                <thead>
                                    <tr className='bg-muted text-left'>
                                        <th className='sticky left-0 z-[1] bg-muted p-2 border-r border-border'>
                                            Renteendring
                                        </th>
                                        <th className='p-2 text-right'>
                                            Boliglån/mnd
                                        </th>
                                        <th className='p-2 text-right'>
                                            Andre lån/mnd
                                        </th>
                                        <th className='p-2 text-right'>
                                            Sum terminbeløp/mnd
                                        </th>
                                        <th className='hidden md:table-cell p-2 text-right'>
                                            Renter/år
                                        </th>
                                        <th className='hidden md:table-cell p-2 text-right'>
                                            Skatt/mnd
                                        </th>
                                        <th className='p-2 text-right'>
                                            Disponibelt/mnd
                                        </th>
                                        <th className='p-2 text-right'>
                                            Endring vs. nå
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {scenarios.map((row) => {
                                        const isBaseline = row.delta === 0;
                                        const diff = baseline
                                            ? row.monthlyDisposable -
                                            baseline.monthlyDisposable
                                            : 0;
                                        return (
                                            <tr
                                                key={row.delta}
                                                className={cn(
                                                    'border-b',
                                                    isBaseline && 'font-medium'
                                                )}
                                            >
                                                <td
                                                    className={cn(
                                                        'sticky left-0 z-[1] p-2 border-r border-border',
                                                        isBaseline
                                                            ? 'bg-muted'
                                                            : 'bg-background'
                                                    )}
                                                >
                                                    {isBaseline
                                                        ? `Nå (${currentHousingRate.toFixed(2)} %)`
                                                        : fmtDelta(row.delta)}
                                                </td>
                                                <td className={cn('p-2 text-right tabular-nums', isBaseline && 'bg-muted')}>
                                                    {fmt(row.housingMonthlyPayment)}
                                                </td>
                                                <td className={cn('p-2 text-right tabular-nums', isBaseline && 'bg-muted')}>
                                                    {fmt(
                                                        row.personalLoansMonthlyPayment
                                                    )}
                                                </td>
                                                <td className={cn('p-2 text-right tabular-nums', isBaseline && 'bg-muted')}>
                                                    {fmt(row.sumMonthlyPayment)}
                                                </td>
                                                <td className={cn('hidden md:table-cell p-2 text-right tabular-nums', isBaseline && 'bg-muted')}>
                                                    {fmt(row.annualInterest)}
                                                </td>
                                                <td className={cn('hidden md:table-cell p-2 text-right tabular-nums', isBaseline && 'bg-muted')}>
                                                    {fmt(row.monthlyTax)}
                                                </td>
                                                <td
                                                    className={cn(
                                                        'p-2 text-right tabular-nums',
                                                        isBaseline && 'bg-muted',
                                                        row.monthlyDisposable < 0 &&
                                                        'text-destructive'
                                                    )}
                                                >
                                                    {fmt(row.monthlyDisposable)}
                                                </td>
                                                <td
                                                    className={cn(
                                                        'p-2 text-right tabular-nums',
                                                        isBaseline && 'bg-muted',
                                                        isBaseline &&
                                                        'text-muted-foreground',
                                                        !isBaseline && diff > 0 &&
                                                        'text-emerald-600',
                                                        !isBaseline && diff < 0 &&
                                                        'text-destructive'
                                                    )}
                                                >
                                                    {isBaseline
                                                        ? '—'
                                                        : fmtSignedNOK(diff)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div
                            aria-hidden
                            className={cn(
                                'pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent transition-opacity',
                                showRightShadow
                                    ? 'opacity-100'
                                    : 'opacity-0'
                            )}
                        />
                    </div>
                )}

                {personalLoans.length > 0 && (
                    <div className='mt-8'>
                        <div className='flex items-center justify-between gap-3 flex-wrap'>
                            <TypographyH2>Juster øvrige lån</TypographyH2>
                            <Button
                                onClick={resetRates}
                                disabled={!hasOverrides}
                                variant='ghost'
                                size='sm'
                            >
                                <RotateCcw className='h-4 w-4' />
                                Tilbakestill
                            </Button>
                        </div>
                        <TypographyP>
                            Endre rente for de øvrige lånene med ±
                            {RATE_STEP.toFixed(2).replace('.', ',')} %. Tabellen
                            oppdateres automatisk.
                        </TypographyP>
                        <div className='mt-4 divide-y divide-border border border-border rounded-md bg-card'>
                            {personalLoans.map((loan, i) => {
                                const rate = effectiveRate(i);
                                const original = originalRates[i] ?? 0;
                                const isChanged = rate !== original;
                                return (
                                    <div
                                        key={i}
                                        className='flex items-center justify-between gap-3 px-4 py-3 flex-wrap'
                                    >
                                        <div className='min-w-0'>
                                            <div className='text-sm font-medium truncate'>
                                                {loan.description || 'Lån'}
                                            </div>
                                            <div className='text-xs text-muted-foreground'>
                                                {fmt(loan.loanAmount)} ·
                                                opprinnelig rente{' '}
                                                {original.toFixed(2)} %
                                            </div>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <Button
                                                onClick={() =>
                                                    adjustRate(i, -RATE_STEP)
                                                }
                                                disabled={rate <= 0}
                                                variant='outline'
                                                size='icon-sm'
                                                aria-label='Senk rente'
                                            >
                                                <Minus className='h-4 w-4' />
                                            </Button>
                                            <span
                                                className={cn(
                                                    'min-w-[5ch] text-center font-mono tabular-nums text-sm',
                                                    isChanged &&
                                                    'text-foreground font-semibold'
                                                )}
                                            >
                                                {rate.toFixed(2)} %
                                            </span>
                                            <Button
                                                onClick={() =>
                                                    adjustRate(i, RATE_STEP)
                                                }
                                                variant='outline'
                                                size='icon-sm'
                                                aria-label='Øk rente'
                                            >
                                                <Plus className='h-4 w-4' />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <TypographyP>
                    Renten er antatt å gjelde over hele løpetiden. Skattefradraget
                    for renter er regnet inn. Derfor endrer skatten seg også når
                    renten endres.
                </TypographyP>
            </section>
        </>
    );
}
