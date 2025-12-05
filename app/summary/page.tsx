'use client';

import { useMemo } from 'react';

import {
    ArrowUpCircle,
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
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import useStore, { StoreState } from '@/lib/store';
import { calculateAnnualTaxes } from '@/lib/calcTaxes';
import { computeLoanAmortization } from '@/lib/amortization';
import { formatNumberToNOK } from '@/lib/utils';

import type { EconomyData, Loan, HousingLoan } from '@/types';

/* ===========================================================
   HELPER: Gjennomsnittlig rente/avdrag/gebyr neste 12 mnd
   =========================================================== */
function averageLoanBreakdown(loan: Loan) {
    const amort = computeLoanAmortization(loan);

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

/* ===========================================================
   MAIN HOOK: all økonomilogikk samlet
   =========================================================== */
function useNetWorthSummary(data: EconomyData, priceGrowth = 3.5) {
    return useMemo(() => {
        /* ----------------------------
           INNTEKT
        ---------------------------- */
        const totalIncomeAnnual = data.incomes.reduce(
            (s, i) => s + i.amount,
            0
        );
        const taxFreeAnnual = data.incomes
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
        const allLoans: Loan[] = [...data.loans, ...data.housingLoans];

        const loanSummaries = allLoans.map((loan) => {
            const breakdown = averageLoanBreakdown(loan);

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
        const housingFixed = data.fixedExpenses
            .filter((f) => f.category === 'housing')
            .reduce((s, f) => s + f.amount, 0);

        const personalFixed = data.fixedExpenses
            .filter((f) => f.category === 'personal')
            .reduce((s, f) => s + f.amount, 0);

        const livingMonthly = data.livingCosts.reduce(
            (s, l) => s + l.amount,
            0
        );

        const totalMonthlyExpenses =
            housingFixed + personalFixed + livingMonthly + loanTotals.total;

        /* ----------------------------
           KONTANTSTRØM
        ---------------------------- */
        const cashflow = netMonthlyIncome - totalMonthlyExpenses;

        /* ----------------------------
           BOLIGKAPITAL (Prisvekst + Avdrag)
        ---------------------------- */
        const monthlyGrowthRate = Math.pow(1 + priceGrowth / 100, 1 / 12) - 1;

        const housingHighlights = data.housingLoans.map((hl: HousingLoan) => {
            const breakdown = loanSummaries.find(
                (s) => s.loan.description === hl.description
            );

            const principal = breakdown?.principal ?? 0;

            // Nå korrekt: boligens verdi = initialEquity + loanAmount
            const homeValue = hl.capital + hl.loanAmount;

            const priceGrowthNOK = homeValue * monthlyGrowthRate;

            return {
                description: hl.description,
                principal,
                priceGrowth: priceGrowthNOK,
                combined: principal + priceGrowthNOK,
                homeValue,
            };
        });

        const totalHousingAppreciation = housingHighlights.reduce(
            (s, h) => s + h.priceGrowth,
            0
        );

        /* ----------------------------
           TOTAL NETTO VERDI / MND
        ---------------------------- */
        const monthlyNetWorthChange =
            cashflow + loanTotals.principal + totalHousingAppreciation;

        /* ----------------------------
   EGENKAPITAL VED SALG I DAG
---------------------------- */
        const today = new Date();

        const currentHousingEquity = data.housingLoans.map((hl) => {
            const amort = computeLoanAmortization({
                loanAmount: hl.loanAmount,
                interestRate: hl.interestRate,
                termYears: hl.termYears,
                termsPerYear: hl.termsPerYear,
                monthlyFee: hl.monthlyFee,
                startDate: hl.startDate,
            });

            const start = new Date(hl.startDate);

            // months passed since loan started
            const monthsFromStart =
                (today.getFullYear() - start.getFullYear()) * 12 +
                (today.getMonth() - start.getMonth());

            // Clamp index to amort length to avoid out-of-range
            const index = Math.max(
                0,
                Math.min(monthsFromStart, amort.monthly.length - 1)
            );

            // Remaining debt today
            const remainingDebt = amort.monthly[index].balance;

            // Home value today = initialEquity + loanAmount
            const homeValue = hl.capital + hl.loanAmount;

            const equityNow = homeValue - remainingDebt;

            return {
                description: hl.description,
                homeValue,
                remainingDebt,
                equityNow,
            };
        });

        const equityProjections = data.housingLoans.map((hl) => {
            const amort = computeLoanAmortization(hl);
            const start = new Date(hl.startDate);
            const today = new Date();

            const monthsFromStart =
                (today.getFullYear() - start.getFullYear()) * 12 +
                (today.getMonth() - start.getMonth());

            const homeValue = hl.capital + hl.loanAmount;

            const projections = [1, 2, 5].map((yearsAhead) => {
                const monthsAhead = yearsAhead * 12;

                // Remaining debt at that time
                const index = Math.min(
                    amort.monthly.length - 1,
                    monthsFromStart + monthsAhead
                );

                const futureDebt = amort.monthly[index].balance;

                // Future home price
                const futurePrice =
                    homeValue * Math.pow(1 + priceGrowth / 100, yearsAhead);

                // Equity = value - debt
                const futureEquity = futurePrice - futureDebt;

                return {
                    yearsAhead,
                    futurePrice,
                    futureDebt,
                    futureEquity,
                };
            });

            return {
                description: hl.description,
                projections,
            };
        });

        const totalCurrentEquity = currentHousingEquity.reduce(
            (s, h) => s + h.equityNow,
            0
        );

        return {
            priceGrowth,

            // Inntekt
            totalIncomeAnnual,
            monthlyIncomeGross,
            taxableMonthly,
            taxFreeMonthly,
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

            // Boligkapital
            housingHighlights,
            totalHousingAppreciation,

            // Netto verdi
            monthlyNetWorthChange,

            // Skatt
            tax,

            // Egenkapital ved salg
            currentHousingEquity,
            totalCurrentEquity,
            equityProjections,
        };
    }, [data, priceGrowth]);
}

export default function SummaryPage() {
    const data = useStore((s: StoreState) => s.data);

    const summary = useNetWorthSummary(data, 3.5);

    const {
        priceGrowth,
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
    } = summary;

    const fmt = (v: number) => formatNumberToNOK(Math.round(v));

    return (
        <div className='py-10 space-y-10'>
            {/* ---------------------------------------------------
               TOPP-KORT
            --------------------------------------------------- */}
            <section className='space-y-4'>
                <div className='container my-8 min-h-24'>
                    <TypographyH1>Din økonomiske status nå</TypographyH1>
                    <TypographyP>
                        Full oversikt over inntekter, utgifter, lån og
                        boligkapital.
                    </TypographyP>
                </div>

                <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                    <Card className='border-primary/20 shadow-sm'>
                        <CardHeader className='pb-2'>
                            <CardDescription className='flex items-center gap-2 text-xs uppercase tracking-wide'>
                                <ArrowUpCircle className='h-4 w-4 text-brandBlue' />
                                Brutto inntekt / mnd
                            </CardDescription>
                            <CardTitle className='text-2xl'>
                                {fmt(monthlyIncomeGross)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className='border-primary/20 shadow-sm'>
                        <CardHeader className='pb-2'>
                            <CardDescription className='flex items-center gap-2 text-xs uppercase tracking-wide'>
                                <PiggyBank className='h-4 w-4 text-brandBlue' />
                                Netto inntekt / mnd
                            </CardDescription>
                            <CardTitle className='text-2xl'>
                                {fmt(netMonthlyIncome)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className='border-primary/20 shadow-sm'>
                        <CardHeader className='pb-2'>
                            <CardDescription className='flex items-center gap-2 text-xs uppercase tracking-wide'>
                                <ReceiptText className='h-4 w-4 text-brandBlue' />
                                Totale utgifter / mnd
                            </CardDescription>
                            <CardTitle className='text-2xl'>
                                {fmt(totalMonthlyExpenses)}
                            </CardTitle>
                        </CardHeader>
                    </Card>

                    <Card className='border-primary/20 shadow-sm'>
                        <CardHeader className='pb-2'>
                            <CardDescription className='flex items-center gap-2 text-xs uppercase tracking-wide'>
                                <Wallet className='h-4 w-4 text-brandBlue' />
                                Kontantstrøm
                            </CardDescription>
                            <CardTitle className='text-2xl'>
                                {fmt(cashflow)}
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            {/* ---------------------------------------------------
               INNTEKTER
            --------------------------------------------------- */}
            <section className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
                <Card className='border-primary/20'>
                    <CardHeader className='space-y-1'>
                        <CardTitle className='flex items-center gap-2'>
                            <BadgeDollarSign className='h-5 w-5 text-brandBlue' />
                            Inntekter
                        </CardTitle>
                        <CardDescription>
                            Både skattepliktige og skattefrie kilder, vist per
                            måned.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-4'>
                        {/* Top summary row */}
                        <div className='flex flex-wrap gap-3 text-sm text-muted-foreground'>
                            <span>Skattepliktig: {fmt(taxableMonthly)}</span>
                            <Separator
                                orientation='vertical'
                                className='hidden sm:block h-4'
                            />
                            <span>Skattefritt: {fmt(taxFreeMonthly)}</span>
                            <Separator
                                orientation='vertical'
                                className='hidden sm:block h-4'
                            />
                        </div>

                        {/* Detailed breakdown */}
                        <div className='grid gap-3 sm:grid-cols-2'>
                            {/* Taxable incomes */}
                            <Card className='border-dashed'>
                                <CardHeader className='pb-2'>
                                    <CardDescription className='text-xs uppercase tracking-wide'>
                                        Skattepliktige inntekter
                                    </CardDescription>
                                    <CardTitle className='text-lg'>
                                        {fmt(taxableMonthly)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-2'>
                                    {data.incomes
                                        .filter((i) => !i.taxFree)
                                        .map((inc, idx) => (
                                            <div
                                                key={`${inc.source}-${idx}`}
                                                className='flex items-center justify-between text-sm'
                                            >
                                                <span className='text-muted-foreground'>
                                                    {inc.source}
                                                </span>
                                                <span className='font-medium'>
                                                    {fmt(inc.amount / 12)}
                                                </span>
                                            </div>
                                        ))}

                                    {data.incomes.filter((i) => !i.taxFree)
                                        .length === 0 && (
                                        <p className='text-sm text-muted-foreground'>
                                            Ingen registrerte skattepliktige
                                            inntekter.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Tax-free incomes */}
                            <Card className='border-dashed'>
                                <CardHeader className='pb-2'>
                                    <CardDescription className='text-xs uppercase tracking-wide'>
                                        Skattefrie inntekter
                                    </CardDescription>
                                    <CardTitle className='text-lg'>
                                        {fmt(taxFreeMonthly)}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className='space-y-2'>
                                    {data.incomes
                                        .filter((i) => i.taxFree)
                                        .map((inc, idx) => (
                                            <div
                                                key={`${inc.source}-${idx}`}
                                                className='flex items-center justify-between text-sm'
                                            >
                                                <span className='text-muted-foreground'>
                                                    {inc.source}
                                                </span>
                                                <span className='font-medium'>
                                                    {fmt(inc.amount / 12)}
                                                </span>
                                            </div>
                                        ))}

                                    {data.incomes.filter((i) => i.taxFree)
                                        .length === 0 && (
                                        <p className='text-sm text-muted-foreground'>
                                            Ingen registrerte skattefrie
                                            inntekter.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>
                {/* ---------------------------------------------------
                   NØKKELTALL
                --------------------------------------------------- */}
                <Card className='border-primary/20'>
                    <CardHeader className='space-y-1'>
                        <CardTitle className='flex items-center gap-2'>
                            <BarChart4 className='h-5 w-5 text-brandBlue' />
                            Nøkkeltall
                        </CardTitle>
                        <CardDescription>
                            Oversikt over renter, avdrag og faste kostnader.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>
                                Renter / mnd*
                            </span>
                            <span className='font-semibold'>
                                {fmt(loanTotals.interest)}
                            </span>
                        </div>

                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>
                                Avdrag / mnd*
                            </span>
                            <span className='font-semibold'>
                                {fmt(loanTotals.principal)}
                            </span>
                        </div>

                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>
                                Gebyrer / mnd
                            </span>
                            <span className='font-semibold'>
                                {fmt(loanTotals.fees)}
                            </span>
                        </div>

                        <Separator />

                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>
                                Boligkostnader
                            </span>
                            <span className='font-semibold'>
                                {fmt(housingFixed)}
                            </span>
                        </div>

                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>
                                Personlige utgifter
                            </span>
                            <span className='font-semibold'>
                                {fmt(personalFixed)}
                            </span>
                        </div>

                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>
                                Levekostnader
                            </span>
                            <span className='font-semibold'>
                                {fmt(livingMonthly)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Skatter */}
                {/* Skatter */}
                <Card className='border-primary/20'>
                    <CardHeader className='space-y-1'>
                        <CardTitle className='flex items-center gap-2'>
                            <ShieldCheck className='h-5 w-5 text-brandBlue' />
                            Skatter
                        </CardTitle>
                        <CardDescription>
                            Oversikt over månedlige skatter basert på inntekter.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-3'>
                        {/* Effective tax rate */}
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>
                                Effektiv skattesats
                            </span>
                            <span className='font-semibold'>
                                {effectiveTaxRate.toFixed(1)}%
                            </span>
                        </div>

                        <Separator />

                        {/* Monthly tax */}
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>
                                Total skatt / mnd
                            </span>
                            <span className='font-semibold'>
                                {fmt(monthlyTax)}
                            </span>
                        </div>

                        {/* Interest deduction */}
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>
                                Rentefradrag
                            </span>
                            <span className='font-semibold'>
                                {fmt(tax.totalInterestDeduction)}
                            </span>
                        </div>

                        {/* Total tax paid annually */}
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>
                                Betalt skatt (årlig)
                            </span>
                            <span className='font-semibold'>
                                {fmt(tax.totalTaxes)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card className='border-primary/20 shadow-sm'>
                    <CardHeader className='space-y-1'>
                        <CardTitle className='flex items-center gap-2'>
                            <ReceiptText className='h-5 w-5 text-brandBlue' />
                            Egenkapital ved salg i dag
                        </CardTitle>
                        <CardDescription>
                            Basert på dagens boligverdi og gjenstående gjeld.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className='space-y-4'>
                        {/* Today */}
                        <p className='text-2xl font-semibold'>
                            {fmt(totalCurrentEquity)}
                        </p>

                        {/* Future projections */}
                        <div className='space-y-1 text-sm'>
                            {equityProjections.map((home) =>
                                home.projections.map((p) => (
                                    <div
                                        key={`${home.description}-${p.yearsAhead}`}
                                        className='flex justify-between text-muted-foreground'
                                    >
                                        <span>
                                            {home.description} · om{' '}
                                            {p.yearsAhead} år
                                        </span>
                                        <span className='font-medium text-foreground'>
                                            {fmt(p.futureEquity)}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* ---------------------------------------------------
               UTGIFTER + LÅN
            --------------------------------------------------- */}
            <section className='grid gap-6 lg:grid-cols-[1fr_1fr]'>
                <Card className='border-primary/20'>
                    <CardHeader className='space-y-1'>
                        <CardTitle className='flex items-center gap-2'>
                            <ReceiptText className='h-5 w-5 text-brandBlue' />
                            Utgifter og lån
                        </CardTitle>
                    </CardHeader>

                    <CardContent className='space-y-4'>
                        <div className='grid gap-3 sm:grid-cols-3'>
                            <div className='rounded-lg border p-3 bg-muted/30'>
                                <p className='text-xs uppercase text-muted-foreground'>
                                    Bolig
                                </p>
                                <p className='text-lg font-semibold'>
                                    {fmt(housingFixed)}
                                </p>
                            </div>

                            <div className='rounded-lg border p-3 bg-muted/30'>
                                <p className='text-xs uppercase text-muted-foreground'>
                                    Personlig
                                </p>
                                <p className='text-lg font-semibold'>
                                    {fmt(personalFixed)}
                                </p>
                            </div>

                            <div className='rounded-lg border p-3 bg-muted/30'>
                                <p className='text-xs uppercase text-muted-foreground'>
                                    Levekostnader
                                </p>
                                <p className='text-lg font-semibold'>
                                    {fmt(livingMonthly)}
                                </p>
                            </div>
                        </div>

                        <div className='space-y-3'>
                            <h3 className='text-sm font-semibold text-muted-foreground'>
                                Lån per måned
                            </h3>

                            {loanSummaries.map(
                                ({ loan, interest, principal, fee, total }) => (
                                    <div
                                        key={loan.description}
                                        className='rounded-lg border p-3 flex flex-wrap items-center justify-between'
                                    >
                                        <div>
                                            <p className='text-sm font-medium'>
                                                {loan.description}
                                            </p>
                                            <p className='text-xs text-muted-foreground'>
                                                Rente {fmt(interest)} · Avdrag*{' '}
                                                {fmt(principal)} · Gebyr{' '}
                                                {fmt(fee)}
                                            </p>
                                        </div>
                                        <Badge
                                            variant='secondary'
                                            className='text-xs'
                                        >
                                            Totalt {fmt(total)}
                                        </Badge>
                                    </div>
                                )
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* ---------------------------------------------------
                   BOLIGKAPITAL
                --------------------------------------------------- */}
                <Card className='border-primary/20'>
                    <CardHeader className='space-y-1'>
                        <CardTitle className='flex items-center gap-2'>
                            <Home className='h-5 w-5 text-brandBlue' />
                            Boligkapital
                        </CardTitle>
                        <CardDescription>
                            Avdrag + antatt prisvekst ({priceGrowth}% årlig)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className='text-xl font-semibold'>
                            Totalt:{' '}
                            {fmt(
                                loanTotals.principal + totalHousingAppreciation
                            )}
                        </p>
                    </CardContent>
                    <CardContent className='space-y-3'>
                        {housingHighlights.map((h) => (
                            <div
                                key={h.description}
                                className='rounded-lg border p-3 flex items-center justify-between'
                            >
                                <div>
                                    <p className='text-sm font-medium'>
                                        {h.description}
                                    </p>
                                    <p className='text-xs text-muted-foreground'>
                                        Avdrag* {fmt(h.principal)} · Prisvekst{' '}
                                        {fmt(h.priceGrowth)}
                                    </p>
                                </div>
                                <Badge className='bg-brandBlue text-white'>
                                    +{fmt(h.combined)} / mnd
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            {/* ---------------------------------------------------
               NETTOVERDI
            --------------------------------------------------- */}
            <Card className='border-primary/20'>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <ReceiptText className='h-5 w-5 text-brandBlue' />
                        Din totale netto verdi per mnd
                    </CardTitle>
                    <CardDescription>
                        Kontantstrøm + avdrag + boligprisvekst.
                    </CardDescription>
                </CardHeader>

                <CardContent className='space-y-4'>
                    <div className='rounded-lg border p-4 bg-muted/40 flex justify-between'>
                        <div>
                            <p className='text-xs text-muted-foreground uppercase tracking-wide'>
                                Total nettoverdi / mnd (inkl. prisvekst på)
                            </p>
                            <p className='text-3xl font-semibold'>
                                {fmt(monthlyNetWorthChange)}
                            </p>
                        </div>
                    </div>

                    <div className='rounded-lg border p-4 bg-muted/40 flex justify-between'>
                        <div>
                            <p className='text-xs text-muted-foreground uppercase tracking-wide'>
                                Total nettoverdi / mnd (ekskl. prisvekst på
                                bolig)
                            </p>
                            <p className='text-3xl font-semibold'>
                                {fmt(
                                    monthlyNetWorthChange -
                                        totalHousingAppreciation
                                )}
                            </p>
                        </div>
                    </div>

                    <div className='grid gap-3 sm:grid-cols-3'>
                        <div className='rounded-lg border p-3 bg-background'>
                            <p className='text-xs text-muted-foreground'>
                                Kontantstrøm
                            </p>
                            <p className='text-lg font-semibold'>
                                {fmt(cashflow)}
                            </p>
                        </div>

                        <div className='rounded-lg border p-3 bg-background'>
                            <p className='text-xs text-muted-foreground'>
                                Avdrag som bygger EK
                            </p>
                            <p className='text-lg font-semibold'>
                                {fmt(loanTotals.principal)}
                            </p>
                        </div>

                        <div className='rounded-lg border p-3 bg-background'>
                            <p className='text-xs text-muted-foreground'>
                                Antatt boligprisvekst
                            </p>
                            <p className='text-lg font-semibold'>
                                {fmt(totalHousingAppreciation)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
