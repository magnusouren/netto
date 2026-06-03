'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calculator, HandCoins, PiggyBank, TrendingUp } from 'lucide-react';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';
import { Button } from '@/components/ui/button';
import { Glance } from '@/components/ledger/Glance';
import useStore, { StoreState } from '@/lib/store';
import { calculateAnnualTaxes } from '@/lib/calcTaxes';
import { formatNumberToNOK } from '@/lib/utils';
import type { Loan } from '@/types';

function monthlyLoanPayment(loan: Loan): number {
    const principal = loan.loanAmount || 0;
    const termsPerYear = loan.termsPerYear || 12;
    const termYears = loan.termYears || 0;
    const n = termYears * termsPerYear;
    if (n <= 0 || principal <= 0) return 0;

    const r = (loan.interestRate || 0) / 100 / termsPerYear;

    let paymentPerTerm = 0;
    if (r === 0) paymentPerTerm = principal / n;
    else paymentPerTerm = (principal * r) / (1 - Math.pow(1 + r, -n));

    return paymentPerTerm * (12 / termsPerYear) + (loan.monthlyFee || 0);
}

export default function Home() {
    const data = useStore((s: StoreState) => s.data);
    const hasHydrated = useStore((s: StoreState) => s._hasHydrated);

    // Get active house (with fallback for old data structure)
    const activeHouse = (data.houses || []).find(
        (h) => h.id === data.activeHouseId
    );

    const totalIncomeAnnual = (data.incomes || []).reduce(
        (sum, income) => sum + income.amount,
        0
    );
    const monthlyIncomeGross = totalIncomeAnnual / 12;

    const tax = calculateAnnualTaxes(data);
    const monthlyTax = tax.totalTaxes / 12;

    // Combine regular loans with active house's housing loan
    const loans: Loan[] = [
        ...data.loans,
        ...(activeHouse ? [activeHouse.housingLoan] : []),
    ];
    const loanMonthlyPayments = loans.reduce(
        (sum, loan) => sum + monthlyLoanPayment(loan),
        0
    );

    // Housing costs from active house
    const housingFixed = activeHouse
        ? (activeHouse.houseMonthlyCosts.hoa || 0) +
        (activeHouse.houseMonthlyCosts.electricity || 0) +
        (activeHouse.houseMonthlyCosts.internet || 0) +
        (activeHouse.houseMonthlyCosts.insurance || 0) +
        (activeHouse.houseMonthlyCosts.propertyTax || 0) +
        (activeHouse.houseMonthlyCosts.maintenance || 0) +
        (activeHouse.houseMonthlyCosts.other || 0)
        : 0;
    const personalFixed = (data.personalFixedExpenses || []).reduce(
        (sum, exp) => sum + exp.amount,
        0
    );
    const livingMonthly = (data.livingCosts || []).reduce(
        (sum, cost) => sum + cost.amount,
        0
    );

    const totalMonthlyExpenses =
        housingFixed + personalFixed + livingMonthly + loanMonthlyPayments;
    const netMonthlyIncome = monthlyIncomeGross - monthlyTax;
    const cashflow = netMonthlyIncome - totalMonthlyExpenses;

    const hasData = monthlyIncomeGross > 0;

    const mock = {
        gross: 55000,
        tax: 16500,
        net: 38500,
        housing: 18500,
        personal: 3500,
        living: 8000,
        cashflow: 8500,
    };

    const display = {
        gross: hasData ? monthlyIncomeGross : mock.gross,
        tax: hasData ? monthlyTax : mock.tax,
        net: hasData ? netMonthlyIncome : mock.net,
        housing: hasData ? housingFixed + loanMonthlyPayments : mock.housing,
        personal: hasData ? personalFixed : mock.personal,
        living: hasData ? livingMonthly : mock.living,
        cashflow: hasData ? cashflow : mock.cashflow,
    };

    const [animated, setAnimated] = useState({
        gross: 0, tax: 0, net: 0, housing: 0, personal: 0, living: 0, cashflow: 0,
    });

    useEffect(() => {
        if (!hasHydrated) return;

        const duration = 1400;
        let raf: number;
        let startTime: number | null = null;

        const step = (ts: number) => {
            if (startTime === null) startTime = ts;
            const progress = Math.min((ts - startTime) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setAnimated({
                gross: Math.round(display.gross * ease),
                tax: Math.round(display.tax * ease),
                net: Math.round(display.net * ease),
                housing: Math.round(display.housing * ease),
                personal: Math.round(display.personal * ease),
                living: Math.round(display.living * ease),
                cashflow: Math.round(display.cashflow * ease),
            });
            if (progress < 1) raf = requestAnimationFrame(step);
        };

        raf = requestAnimationFrame(step);
        return () => cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasHydrated]);

    return (
        <div className='w-full py-10 space-y-24'>
            {/* ── Hero ── */}
            <section className='grid gap-12 lg:grid-cols-[1.15fr_0.85fr] items-center'>
                <div className='space-y-7'>
                    <div className='inline-flex items-center gap-2 rounded-full border border-brandOrange/40 bg-brandOrange/10 px-4 py-1.5 text-sm font-medium text-brandBlue'>
                        <HandCoins className='h-4 w-4' />
                        Nettbasert økonomiverktøy
                    </div>

                    <TypographyH1>
                        Full oversikt over din månedlige økonomi
                    </TypographyH1>

                    <TypographyP>
                        NETTO samler inntekter, lån og utgifter på ett sted og
                        viser hvor mye du sitter igjen med etter skatt
                        og faste kostnader per måned. Planlegg ditt boligkjøp og se hvordan ulike faktorer påvirker din økonomi!
                    </TypographyP>

                    <div className='flex flex-wrap gap-3 pt-1'>
                        <Button size='lg' asChild>
                            <Link href='/data'>Kom i gang</Link>
                        </Button>
                        <Button size='lg' variant='outline' asChild>
                            <Link href='/summary'>Se oppsummering</Link>
                        </Button>
                    </div>
                </div>

                <Glance
                    className={!hasData ? 'opacity-80' : undefined}
                    title='Månedlig kontantstrøm'
                    subtitle={
                        hasData
                            ? 'Basert på dine innlagte tall'
                            : 'Legg inn dine tall for å se ditt regnskap'
                    }
                    indexLabel={!hasData ? 'Eksempel' : undefined}
                >
                    <Glance.Row
                        label='Bruttoinntekt'
                        value={'+ ' + formatNumberToNOK(animated.gross)}
                    />
                    <Glance.Row
                        label='Skatt'
                        value={'− ' + formatNumberToNOK(animated.tax)}
                    />
                    <Glance.Row
                        label='Boligutgifter (fast)'
                        value={'− ' + formatNumberToNOK(animated.housing)}
                    />
                    <Glance.Row
                        label='Personlige faste utgifter'
                        value={'− ' + formatNumberToNOK(animated.personal)}
                    />
                    <Glance.Row
                        label='Levekostnader'
                        value={'− ' + formatNumberToNOK(animated.living)}
                    />
                    <Glance.Total
                        label='Kontantstrøm'
                        value={
                            <span
                                className={
                                    display.cashflow >= 0
                                        ? 'text-emerald-600'
                                        : 'text-destructive'
                                }
                            >
                                {(display.cashflow >= 0 ? '+ ' : '− ') +
                                    formatNumberToNOK(
                                        Math.abs(animated.cashflow)
                                    )}
                            </span>
                        }
                    />
                </Glance>
            </section>

            {/* ── How it works ── */}
            <section className='space-y-10 bg-brandBlue/10 p-8 rounded-lg'>
                <div className='space-y-2'>
                    <TypographyH2>Kom i gang på tre steg</TypographyH2>
                    <TypographyP>
                        Tre enkle steg for å få full kontroll på kontantstrømmen din.
                    </TypographyP>
                </div>
                <div className='grid gap-8 md:grid-cols-3'>
                    {[
                        {
                            step: '01',
                            title: 'Legg inn inntekter',
                            desc: 'Oppgi bruttoinntekt fra jobb, kapital eller andre kilder, så beregnes skatten automatisk.',
                        },
                        {
                            step: '02',
                            title: 'Legg til bolig og lån',
                            desc: 'Knytt boligkostnader og lån til regnestykket. Se nøyaktig hva boligen faktisk koster per måned.',
                        },
                        {
                            step: '03',
                            title: 'Se din oppsummering',
                            desc: 'Få en klar oversikt over hva som er igjen etter alle faste utgifter, og hvor mye du kan spare.',
                        },
                    ].map(({ step, title, desc }) => (
                        <div key={step} className='flex flex-col gap-4'>
                            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-brandBlue text-md font-bold text-brandOrange shrink-0'>
                                {step}
                            </div>
                            <div>
                                <h3 className='font-semibold text-base text-brandBlue'>{title}</h3>
                                <p className='mt-1.5 text-sm text-muted-foreground leading-relaxed'>{desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features ── */}
            <section className='space-y-8'>
                <div className='space-y-2'>
                    <TypographyH2>Alt du trenger på ett sted</TypographyH2>
                    <TypographyP>
                        Verktøyene er bygget for norske forhold med norske skatteregler.
                    </TypographyP>
                </div>
                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                    <Glance
                        title='Presise beregninger'
                        subtitle='Skatt · Lån · Nedbetaling'
                        indexLabel={<Calculator className='h-3 w-3' />}
                    >
                        <p className='py-3 text-sm text-muted-foreground leading-relaxed'>
                            Beregn skatt, lån og nedbetalingsplaner med norske
                            forutsetninger og oppdaterte satser.
                        </p>
                    </Glance>

                    <Glance
                        title='Helhetlig oversikt'
                        subtitle='Inntekter · Lån · Utgifter'
                        indexLabel={<TrendingUp className='h-3 w-3' />}
                    >
                        <p className='py-3 text-sm text-muted-foreground leading-relaxed'>
                            Kombiner inntekter, lån og utgifter for å se hvordan
                            kontantstrømmen din faktisk ser ut per måned.
                        </p>
                    </Glance>

                    <Glance
                        title='Plan for sparing'
                        subtitle='Egenkapital · Buffere'
                        indexLabel={<PiggyBank className='h-3 w-3' />}
                    >
                        <p className='py-3 text-sm text-muted-foreground leading-relaxed'>
                            Følg egenkapital over tid og se hvordan små
                            justeringer påvirker hvor mye du kan legge til side.
                        </p>
                    </Glance>
                </div>
            </section>
        </div>
    );
}
