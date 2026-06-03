'use client';

import { useEffect, useMemo, useState } from 'react';

import {
    BadgeDollarSign,
    BarChart4,
    Home,
    PiggyBank,
    ReceiptText,
    ShieldCheck,
    Wallet,
} from 'lucide-react';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyP } from '@/components/typography/typographyP';
import { Glance } from '@/components/ledger/Glance';
import { LabelMono } from '@/components/ledger/LabelMono';

import useStore, { StoreState } from '@/lib/store';
import { calculateAnnualTaxes } from '@/lib/calcTaxes';
import { computeLoanAmortization } from '@/lib/amortization';
import {
    AmortizationLookup,
    buildLoanCacheKey,
    createAmortizationCache,
} from '@/lib/amortizationCache';
import { formatNumberToNOK } from '@/lib/utils';

import type {
    EconomyData,
    Loan,
    HouseOption,
    HouseMonthlyCosts,
} from '@/types';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@radix-ui/react-label';

/* ===========================================================
   HELPER: Sum house monthly costs
   =========================================================== */
function totalHouseMonthlyCosts(costs: HouseMonthlyCosts): number {
    return (
        (costs.hoa || 0) +
        (costs.electricity || 0) +
        (costs.internet || 0) +
        (costs.insurance || 0) +
        (costs.propertyTax || 0) +
        (costs.maintenance || 0) +
        (costs.other || 0)
    );
}

/* ===========================================================
   HELPER: Gjennomsnittlig rente/avdrag/gebyr neste 12 mnd
   =========================================================== */
function averageLoanBreakdown(
    loan: Loan,
    amort: ReturnType<typeof computeLoanAmortization>
) {
    if (!amort.monthly || amort.monthly.length === 0) {
        return { interest: 0, principal: 0, fee: loan.monthlyFee || 0 };
    }

    const monthsPerTerm = Math.max(1, Math.round(12 / loan.termsPerYear));

    const start = new Date(loan.startDate);
    const today = new Date();
    const hasValidStart = !Number.isNaN(start.getTime());

    const monthDiff = hasValidStart
        ? (today.getFullYear() - start.getFullYear()) * 12 +
        (today.getMonth() - start.getMonth())
        : 0;

    const termIndex = Math.min(
        Math.max(Math.floor(monthDiff / monthsPerTerm), 0),
        amort.monthly.length - 1
    );

    const next12 = amort.monthly.slice(termIndex, termIndex + 12);

    if (next12.length === 0) {
        return { interest: 0, principal: 0, fee: loan.monthlyFee || 0 };
    }

    const interest = next12.reduce((s, m) => s + m.interest, 0) / next12.length;
    const principal =
        next12.reduce((s, m) => s + m.principal, 0) / next12.length;
    const fee = next12.reduce((s, m) => s + m.fee, 0) / next12.length;

    return { interest, principal, fee };
}

function GhostRow({ lines = 2 }: { lines?: number }) {
    return (
        <div className='animate-pulse space-y-2 rounded-lg border p-3 bg-muted/40'>
            {Array.from({ length: lines }).map((_, idx) => (
                <div key={idx} className='h-3 rounded bg-muted' />
            ))}
        </div>
    );
}

/* ===========================================================
   MAIN HOOK: all økonomilogikk samlet
   =========================================================== */
function useNetWorthSummary(data: EconomyData, priceGrowth = 3.5) {
    const amortizationCache = useMemo(() => createAmortizationCache(), []);

    // Get active house
    const activeHouse = useMemo(
        () => (data.houses || []).find((h) => h.id === data.activeHouseId),
        [data.houses, data.activeHouseId]
    );

    const allLoans: Loan[] = useMemo(
        () => [
            ...data.loans,
            ...(activeHouse ? [activeHouse.housingLoan] : []),
        ],
        [activeHouse, data.loans]
    );

    const amortizationLookup: AmortizationLookup = useMemo(() => {
        const map = new Map<
            string,
            ReturnType<typeof computeLoanAmortization>
        >();

        allLoans.forEach((loan) => {
            map.set(buildLoanCacheKey(loan), amortizationCache.get(loan));
        });

        return {
            get: (loan: Loan) =>
                map.get(buildLoanCacheKey(loan)) ?? amortizationCache.get(loan),
        };
    }, [allLoans, amortizationCache]);

    const createBalanceLookup = (
        amortization: ReturnType<typeof computeLoanAmortization>,
        fallbackBalance: number
    ) => {
        const schedule = amortization.monthly ?? [];

        return (monthIndex: number) => {
            if (schedule.length === 0) return fallbackBalance;

            const clampedIndex = Math.max(
                0,
                Math.min(monthIndex, schedule.length - 1)
            );

            return schedule[clampedIndex]?.balance ?? fallbackBalance;
        };
    };

    const baseSummary = useMemo(() => {
        /* ----------------------------
           INNTEKT
        ---------------------------- */
        const totalIncomeAnnual = (data.incomes || []).reduce(
            (s, i) => s + i.amount,
            0
        );
        const taxFreeAnnual = (data.incomes || [])
            .filter((i) => i.taxFree)
            .reduce((s, i) => s + i.amount, 0);

        const taxableAnnual = totalIncomeAnnual - taxFreeAnnual;

        const monthlyIncomeGross = totalIncomeAnnual / 12;
        const taxFreeMonthly = taxFreeAnnual / 12;
        const taxableMonthly = taxableAnnual / 12;

        const tax = calculateAnnualTaxes(data);
        const monthlyTax = tax.totalTaxes / 12;
        const netMonthlyIncome = monthlyIncomeGross - monthlyTax;

        /* ----------------------------
           LÅN
        ---------------------------- */

        const loanSummaries = allLoans.map((loan) => {
            const amort = amortizationLookup.get(loan);
            const breakdown = averageLoanBreakdown(loan, amort);

            const total =
                breakdown.interest + breakdown.principal + breakdown.fee;

            return { loan, ...breakdown, total };
        });

        const loanTotals = loanSummaries.reduce(
            (acc, item) => {
                acc.interest += item.interest;
                acc.principal += item.principal;
                acc.fees += item.fee;
                acc.total += item.total;
                return acc;
            },
            { interest: 0, principal: 0, fees: 0, total: 0 }
        );

        /* ----------------------------
           KOSTNADER
        ---------------------------- */
        // Housing costs from active house
        const housingFixed = activeHouse
            ? totalHouseMonthlyCosts(activeHouse.houseMonthlyCosts)
            : 0;

        const personalFixed = (data.personalFixedExpenses || []).reduce(
            (s, f) => s + f.amount,
            0
        );

        const livingMonthly = (data.livingCosts || []).reduce(
            (s, l) => s + l.amount,
            0
        );

        const totalMonthlyExpenses =
            housingFixed + personalFixed + livingMonthly + loanTotals.total;

        /* ----------------------------
           KONTANTSTRØM
        ---------------------------- */
        const cashflow = netMonthlyIncome - totalMonthlyExpenses;

        // Housing context for active house only
        const housingContexts = activeHouse
            ? [
                {
                    loan: activeHouse.housingLoan,
                    amortization: amortizationLookup.get(
                        activeHouse.housingLoan
                    ),
                    baseHomeValue:
                        activeHouse.purchase.equityUsed +
                        activeHouse.housingLoan.loanAmount,
                },
            ]
            : [];

        return {
            // Inntekt
            totalIncomeAnnual,
            taxableAnnual,
            taxFreeAnnual,
            monthlyIncomeGross,
            taxFreeMonthly,
            taxableMonthly,
            monthlyTax,
            netMonthlyIncome,
            effectiveTaxRate: tax.effectiveTaxRate,

            // Lån
            loanSummaries,
            loanTotals,

            // Kostnader
            housingFixed,
            personalFixed,
            livingMonthly,
            totalMonthlyExpenses,

            // Kontantstrøm
            cashflow,

            // Skatt
            tax,

            housingContexts,

            // Active house for reference
            activeHouse,
        };
    }, [activeHouse, allLoans, amortizationLookup, data]);

    const priceDependent = useMemo(() => {
        const monthlyGrowthRate = Math.pow(1 + priceGrowth / 100, 1 / 12) - 1;

        const today = new Date();

        const summaryLookup = new Map(
            baseSummary.loanSummaries.map((item) => [
                item.loan.description,
                item,
            ])
        );

        const housingHighlights = baseSummary.housingContexts.map((hl) => {
            const breakdown = summaryLookup.get(hl.loan.description);
            const principal = breakdown?.principal ?? 0;

            const priceGrowthNOK = hl.baseHomeValue * monthlyGrowthRate;

            return {
                description: hl.loan.description,
                principal,
                priceGrowth: priceGrowthNOK,
                combined: principal + priceGrowthNOK,
                homeValue: hl.baseHomeValue,
            };
        });

        const totalHousingAppreciation = housingHighlights.reduce(
            (s, h) => s + h.priceGrowth,
            0
        );

        const monthlyNetWorthChange =
            baseSummary.cashflow +
            baseSummary.loanTotals.principal +
            totalHousingAppreciation;

        const currentHousingEquity = baseSummary.housingContexts.map((hl) => {
            const start = new Date(hl.loan.startDate);

            const getBalanceAtMonth = createBalanceLookup(
                hl.amortization,
                hl.loan.loanAmount
            );

            const monthsFromStart =
                (today.getFullYear() - start.getFullYear()) * 12 +
                (today.getMonth() - start.getMonth());

            const remainingDebt = getBalanceAtMonth(monthsFromStart);

            const yearsSinceStart = monthsFromStart / 12;

            const homeValue =
                hl.baseHomeValue *
                Math.pow(1 + priceGrowth / 100, yearsSinceStart);

            const equityNow = homeValue - remainingDebt;

            return {
                description: hl.loan.description,
                homeValue,
                remainingDebt,
                equityNow,
            };
        });

        const equityProjections = baseSummary.housingContexts.map((hl) => {
            const getBalanceAtMonth = createBalanceLookup(
                hl.amortization,
                hl.loan.loanAmount
            );

            const horizons = [1, 2, 5];

            const projections = horizons.map((yearsAhead) => {
                const monthsAhead = yearsAhead * 12;

                const futureDebt = getBalanceAtMonth(monthsAhead);

                const futurePrice =
                    hl.baseHomeValue *
                    Math.pow(1 + priceGrowth / 100, yearsAhead);

                const futureEquity = futurePrice - futureDebt;

                return {
                    yearsAhead,
                    futureEquity,
                };
            });

            return {
                description: hl.loan.description,
                projections,
            };
        });

        const equityTimeline = baseSummary.housingContexts.map((hl) => {
            const start = new Date(hl.loan.startDate);

            const getBalanceAtMonth = createBalanceLookup(
                hl.amortization,
                hl.loan.loanAmount
            );

            const monthsFromStart =
                (today.getFullYear() - start.getFullYear()) * 12 +
                (today.getMonth() - start.getMonth());

            const timelineIndices = [
                0,
                monthsFromStart,
                monthsFromStart + 12,
                monthsFromStart + 24,
                monthsFromStart + 60,
            ];

            const labels = [
                'Ved start',
                'I dag',
                'Om 1 år',
                'Om 2 år',
                'Om 5 år',
            ];

            const entries = timelineIndices.map((index, i) => {
                const remainingDebt = getBalanceAtMonth(index);

                const yearsSinceStart = Math.max(index, 0) / 12;

                const futurePrice =
                    hl.baseHomeValue *
                    Math.pow(1 + priceGrowth / 100, yearsSinceStart);

                const equity = futurePrice - remainingDebt;

                return {
                    label: labels[i],
                    index,
                    remainingDebt,
                    futurePrice,
                    equity,
                };
            });

            return {
                description: hl.loan.description,
                entries,
            };
        });

        const totalCurrentEquity = currentHousingEquity.reduce(
            (s, h) => s + h.equityNow,
            0
        );

        return {
            housingHighlights,
            totalHousingAppreciation,
            monthlyNetWorthChange,
            currentHousingEquity,
            equityProjections,
            equityTimeline,
            totalCurrentEquity,
        };
    }, [baseSummary, priceGrowth]);

    return {
        ...baseSummary,
        ...priceDependent,
    };
}

export default function SummaryPage() {
    const [priceGrowthInput, setPriceGrowthInput] = useState('3.5');
    const [priceGrowth, setPriceGrowth] = useState(3.5);
    const [isUpdatingPriceGrowth, setIsUpdatingPriceGrowth] = useState(false);
    const data = useStore((s: StoreState) => s.data);

    useEffect(() => {
        const handle = setTimeout(() => {
            setIsUpdatingPriceGrowth(true);
            const parsed = parseFloat(priceGrowthInput.replace(',', '.'));
            const nextGrowth = Number.isFinite(parsed) ? parsed : 0;
            setPriceGrowth((prev) => (prev === nextGrowth ? prev : nextGrowth));
            setIsUpdatingPriceGrowth(false);
        }, 250);

        return () => clearTimeout(handle);
    }, [priceGrowthInput]);

    const summary = useNetWorthSummary(data, priceGrowth);

    const {
        monthlyIncomeGross,
        netMonthlyIncome,
        taxableMonthly,
        taxFreeMonthly,
        monthlyTax,
        effectiveTaxRate,

        loanSummaries,
        loanTotals,

        housingFixed,
        personalFixed,
        livingMonthly,
        totalMonthlyExpenses,

        cashflow,

        housingHighlights,
        totalHousingAppreciation,

        monthlyNetWorthChange,

        tax,

        totalCurrentEquity,
        equityProjections,
        equityTimeline,
    } = summary;

    const fmt = (v: number) => formatNumberToNOK(Math.round(v));
    const housingSkeletonCount = Math.max(
        housingHighlights.length || 0,
        (data.houses || []).length || 1
    );

    return (
        <div className='py-10 space-y-6 '>
            {/* ---------------------------------------------------
               TOPP-KORT
            --------------------------------------------------- */}
            <section className='space-y-6'>
                <div className='container my-8 min-h-24'>
                    <TypographyH1>Din økonomiske status nå</TypographyH1>
                    <TypographyP>
                        Full oversikt over inntekter, utgifter, lån og
                        boligkapital.
                    </TypographyP>
                </div>

                <div className='grid gap-6 sm:grid-cols-2 xl:grid-cols-3'>
                    <Glance
                        title={fmt(netMonthlyIncome)}
                        subtitle='Netto inntekt / mnd'
                        indexLabel={<PiggyBank className='h-3 w-3' />}
                    />

                    <Glance
                        title={fmt(totalMonthlyExpenses)}
                        subtitle='Totale utgifter / mnd'
                        indexLabel={<ReceiptText className='h-3 w-3' />}
                    />

                    <Glance
                        title={fmt(cashflow)}
                        subtitle='Kontantstrøm'
                        indexLabel={<Wallet className='h-3 w-3' />}
                    />
                </div>
            </section>

            {/* ---------------------------------------------------
               INNTEKTER
            --------------------------------------------------- */}
            <section className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
                <Glance
                    title='Dine inntekter'
                    subtitle='Per måned, skattepliktige og skattefrie kilder'
                    indexLabel={<BadgeDollarSign className='h-3 w-3' />}
                >
                    <div className='py-2'>
                        <LabelMono className='text-[10px]'>
                            Skattepliktige
                        </LabelMono>
                    </div>
                    {data.incomes
                        .filter((i) => !i.taxFree)
                        .map((inc, idx) => (
                            <Glance.Row
                                key={`tx-${inc.source}-${idx}`}
                                label={inc.source}
                                value={'+ ' + fmt(inc.amount / 12)}
                            />
                        ))}
                    {(data.incomes || []).filter((i) => !i.taxFree).length === 0 && (
                        <p className='py-3 text-sm text-muted-foreground'>
                            Ingen registrerte skattepliktige inntekter.
                        </p>
                    )}

                    {(data.incomes || []).some((i) => i.taxFree) && (
                        <>
                            <div className='pt-4 pb-2'>
                                <LabelMono className='text-[10px]'>
                                    Skattefrie
                                </LabelMono>
                            </div>
                            {(data.incomes || [])
                                .filter((i) => i.taxFree)
                                .map((inc, idx) => (
                                    <Glance.Row
                                        key={`tf-${inc.source}-${idx}`}
                                        label={inc.source}
                                        value={'+ ' + fmt(inc.amount / 12)}
                                    />
                                ))}
                        </>
                    )}

                    <Glance.Total
                        label='Sum brutto / mnd'
                        value={fmt(taxableMonthly + taxFreeMonthly)}
                    />
                </Glance>

                {/* ---------------------------------------------------
                   NØKKELTALL
                --------------------------------------------------- */}
                <Glance
                    title='Dine utgifter'
                    subtitle='Renter, avdrag og faste kostnader'
                    indexLabel={<BarChart4 className='h-3 w-3' />}
                >
                    <div className='py-2'>
                        <LabelMono className='text-[10px]'>Lån</LabelMono>
                    </div>
                    <Glance.Row
                        label='Renter / mnd*'
                        value={'− ' + fmt(loanTotals.interest)}
                    />
                    <Glance.Row
                        label='Avdrag / mnd*'
                        value={'− ' + fmt(loanTotals.principal)}
                    />
                    <Glance.Row
                        label='Gebyrer / mnd'
                        value={'− ' + fmt(loanTotals.fees)}
                    />
                    <div className='pt-4 pb-2'>
                        <LabelMono className='text-[10px]'>
                            Faste kostnader
                        </LabelMono>
                    </div>
                    <Glance.Row
                        label='Boligkostnader'
                        value={'− ' + fmt(housingFixed)}
                    />
                    <Glance.Row
                        label='Personlige utgifter'
                        value={'− ' + fmt(personalFixed)}
                    />
                    <Glance.Row
                        label='Levekostnader'
                        value={'− ' + fmt(livingMonthly)}
                    />
                    <Glance.Total
                        label='Sum utgifter / mnd'
                        value={fmt(
                            housingFixed +
                            personalFixed +
                            livingMonthly +
                            loanTotals.total
                        )}
                    />
                </Glance>
            </section>

            {/* ---------------------------------------------------
               NETTOVERDI
            --------------------------------------------------- */}
            <section className='container'>
                <Glance
                    title='Nettoverdi per måned'
                    subtitle='Hvordan boliglån, prisvekst og avdrag påvirker nettoverdien'
                    indexLabel={<ReceiptText className='h-3 w-3' />}
                >
                    <Glance.Row
                        label='Kontantstrøm'
                        value={fmt(cashflow)}
                    />
                    <Glance.Row
                        label='Avdrag som bygger EK'
                        value={'+ ' + fmt(loanTotals.principal)}
                    />
                    <Glance.Row
                        label='Antatt boligprisvekst'
                        value={'+ ' + fmt(totalHousingAppreciation)}
                    />
                    <Glance.Total
                        label='Nettoverdi / mnd (inkl. prisvekst)'
                        value={fmt(monthlyNetWorthChange)}
                    />
                    <div className='pt-4 flex justify-between items-baseline border-t border-border/60'>
                        <span className='text-xs text-muted-foreground uppercase tracking-wider'>
                            Ekskl. prisvekst på bolig
                        </span>
                        <span className='font-mono tabular-nums text-base'>
                            {fmt(monthlyNetWorthChange - totalHousingAppreciation)}
                        </span>
                    </div>
                </Glance>
            </section>

            <section className='grid gap-6 lg:grid-cols-[0.9fr_1.1fr]'>
                {/* Skatter */}
                <Glance
                    title='Skatter'
                    subtitle='Månedlige skatter basert på inntekter'
                    indexLabel={<ShieldCheck className='h-3 w-3' />}
                >
                    <Glance.Row
                        label='Effektiv skattesats'
                        value={`${effectiveTaxRate.toFixed(1)}%`}
                    />
                    <Glance.Row
                        label='Total skatt / mnd'
                        value={fmt(monthlyTax)}
                    />
                    <Glance.Row
                        label='Betalt skatt (årlig)'
                        value={fmt(tax.totalTaxes)}
                    />
                </Glance>

                <Glance
                    title='Egenkapital'
                    subtitle={`Fra lånestart → i dag → fremtid (med ${priceGrowth}% prisvekst)`}
                    indexLabel={<ReceiptText className='h-3 w-3' />}
                    footnote={
                        <>
                            <span>Total egenkapital i dag</span>
                            <span className='font-mono tabular-nums'>
                                {fmt(totalCurrentEquity)}
                            </span>
                        </>
                    }
                >
                    {isUpdatingPriceGrowth ? (
                        <div className='space-y-2 py-2' aria-busy='true'>
                            {Array.from({
                                length: housingSkeletonCount,
                            }).map((_, idx) => (
                                <GhostRow
                                    key={`equity-ghost-${idx}`}
                                    lines={4}
                                />
                            ))}
                        </div>
                    ) : (
                        equityTimeline.map((home, hIdx) => (
                            <div key={home.description}>
                                <div
                                    className={
                                        hIdx === 0 ? 'py-2' : 'pt-4 pb-2'
                                    }
                                >
                                    <LabelMono className='text-[10px]'>
                                        {home.description}
                                    </LabelMono>
                                </div>
                                {home.entries.map((e) => (
                                    <Glance.Row
                                        key={e.label}
                                        label={e.label}
                                        value={fmt(e.equity)}
                                    />
                                ))}
                            </div>
                        ))
                    )}
                </Glance>
            </section>

            {/* ---------------------------------------------------
               UTGIFTER + LÅN
            --------------------------------------------------- */}
            <section className='grid gap-6 lg:grid-cols-[1fr_1fr]'>
                <Glance
                    title='Utgifter og lånekostnader'
                    subtitle={`${fmt(housingFixed + personalFixed + livingMonthly)} faste + ${fmt(loanTotals.total)} lån per måned`}
                    indexLabel={<ReceiptText className='h-3 w-3' />}
                >
                    <div className='py-2'>
                        <LabelMono className='text-[10px]'>
                            Faste kostnader
                        </LabelMono>
                    </div>
                    <Glance.Row
                        label='Bolig'
                        value={'− ' + fmt(housingFixed)}
                    />
                    <Glance.Row
                        label='Personlig'
                        value={'− ' + fmt(personalFixed)}
                    />
                    <Glance.Row
                        label='Levekostnader'
                        value={'− ' + fmt(livingMonthly)}
                    />

                    <div className='pt-4 pb-2'>
                        <LabelMono className='text-[10px]'>
                            Lån per måned
                        </LabelMono>
                    </div>
                    {loanSummaries.map(
                        ({ loan, interest, principal, fee, total }) => (
                            <Glance.Row
                                key={loan.description}
                                label={
                                    <span className='flex flex-col'>
                                        <span className='text-sm text-foreground'>
                                            {loan.description}
                                        </span>
                                        <span className='text-[11px] text-muted-foreground'>
                                            Rente* {fmt(interest)} · Avdrag*{' '}
                                            {fmt(principal)} · Gebyr {fmt(fee)}
                                        </span>
                                    </span>
                                }
                                value={'− ' + fmt(total)}
                            />
                        )
                    )}
                </Glance>

                {/* ---------------------------------------------------
                   BOLIGKAPITAL
                --------------------------------------------------- */}
                <Glance
                    title='Boligkapital'
                    subtitle={`Avdrag + antatt prisvekst (${priceGrowth}% årlig)`}
                    indexLabel={<Home className='h-3 w-3' />}
                    footnote={
                        <>
                            <span>Totalt egenkapitalbygging / mnd</span>
                            <span className='font-mono tabular-nums'>
                                {'+ ' +
                                    fmt(
                                        loanTotals.principal +
                                        totalHousingAppreciation
                                    )}
                            </span>
                        </>
                    }
                >
                    {isUpdatingPriceGrowth ? (
                        <div className='space-y-3 py-2' aria-busy='true'>
                            {Array.from({
                                length: housingSkeletonCount,
                            }).map((_, idx) => (
                                <GhostRow key={`housing-ghost-${idx}`} />
                            ))}
                        </div>
                    ) : (
                        housingHighlights.map((h) => (
                            <Glance.Row
                                key={h.description}
                                label={
                                    <span className='flex flex-col'>
                                        <span className='text-sm text-foreground'>
                                            {h.description}
                                        </span>
                                        <span className='text-[11px] text-muted-foreground'>
                                            Avdrag* {fmt(h.principal)} ·
                                            Prisvekst {fmt(h.priceGrowth)}
                                        </span>
                                    </span>
                                }
                                value={'+ ' + fmt(h.combined)}
                            />
                        ))
                    )}
                </Glance>
            </section>

            <section className='container space-y-4'>
                {/* Endre prisvekst */}
                <div className='text-sm text-muted-foreground'>
                    <Label htmlFor='priceGrowth' className='font-medium'>
                        Prisvekst bolig (% per år):
                    </Label>
                    <NumericInput
                        value={priceGrowthInput}
                        onChange={(e) => {
                            setPriceGrowthInput(e.target.value);
                        }}
                        aria-busy={isUpdatingPriceGrowth}
                        step={0.1}
                        min={0}
                        max={100}
                    />{' '}
                    % antatt årlig prisvekst som brukes i beregningene på denne
                    siden.
                </div>
                <p className='font-sm text-muted-foreground'>
                    * Avdrag og renter er basert på gjennomsnittlige beløp de
                    neste 12 månedene.
                </p>
            </section>
        </div>
    );
}
