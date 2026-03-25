'use client';

import Link from 'next/link';
import { Calculator, HandCoins, PiggyBank, TrendingUp } from 'lucide-react';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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

    return (
        <div className='w-full py-10 space-y-12'>
            <section className='grid gap-8 lg:grid-cols-[1.1fr_0.9fr] items-center'>
                <div className='space-y-6'>
                    <div className='inline-flex items-center rounded-full bg-brandOrange/20 px-3 py-1 text-sm font-medium text-brandBlue'>
                        <HandCoins className='mr-2 h-4 w-4 ' />
                        Nettbasert økonomiverktøy
                    </div>
                    <TypographyH1>Få oversikt over økonomien din</TypographyH1>
                    <TypographyP>
                        NETTO hjelper deg å samle inntekter, utgifter og lån på
                        ett sted slik at du raskt ser hvordan nøkkeltallene dine
                        utvikler seg. Legg inn grunnlagsdata og utforsk
                        kalkulatorene for å ta bedre beslutninger.
                    </TypographyP>

                    <div className='flex flex-wrap gap-3 my-4'>
                        <Button asChild>
                            <Link href='/data'>Legg inn data</Link>
                        </Button>
                        <Button asChild variant='outline'>
                            <Link href='/summary'>Se oppsummering</Link>
                        </Button>
                    </div>
                </div>

                <Card className='border-primary/20 shadow-md bg-linear-to-br from-background to-brandBlue/10'>
                    <CardHeader>
                        <CardTitle className='text-xl'>
                            Det viktigste i et blikk
                        </CardTitle>
                        <CardDescription>
                            Følg med på nettoinntekt, løpende utgifter og hvor
                            mye som er igjen til sparing.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='grid gap-4 sm:grid-cols-2'>
                            <div className='rounded-lg bg-background p-4 border'>
                                <p className='text-sm text-muted-foreground'>
                                    Netto inntekt / mnd
                                </p>
                                <p className='text-2xl font-semibold'>
                                    {formatNumberToNOK(netMonthlyIncome)}
                                </p>
                            </div>
                            <div className='rounded-lg bg-background p-4 border'>
                                <p className='text-sm text-muted-foreground'>
                                    Løpende utgifter / mnd
                                </p>
                                <p className='text-2xl font-semibold'>
                                    {formatNumberToNOK(totalMonthlyExpenses)}
                                </p>
                            </div>
                            <div className='rounded-lg bg-background p-4 border'>
                                <p className='text-sm text-muted-foreground'>
                                    Aktive lån
                                </p>
                                <p className='text-2xl font-semibold'>
                                    {loans.length}
                                </p>
                            </div>
                            <div className='rounded-lg bg-background p-4 border'>
                                <p className='text-sm text-muted-foreground'>
                                    Kontantstrøm / mnd
                                </p>
                                <p className='text-2xl font-semibold'>
                                    {formatNumberToNOK(cashflow)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className='space-y-6'>
                <TypographyH2>Hvorfor bruke NETTO?</TypographyH2>
                <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3 mt-4'>
                    <Card>
                        <CardHeader className='flex flex-row items-start gap-3'>
                            <div className='rounded-full bg-brandBlue/90 p-2 text-brandOrange'>
                                <Calculator className='h-5 w-5' />
                            </div>
                            <div>
                                <CardTitle>Presise kalkulatorer</CardTitle>
                                <CardDescription>
                                    Beregn skatt, lån og nedbetalingsplaner med
                                    norske forutsetninger og oppdaterte satser.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className='flex flex-row items-start gap-3'>
                            <div className='rounded-full bg-brandBlue/90 p-2 text-brandOrange'>
                                <TrendingUp className='h-5 w-5' />
                            </div>
                            <div>
                                <CardTitle>Helhetlig oversikt</CardTitle>
                                <CardDescription>
                                    Kombiner inntekter, lån og utgifter for å se
                                    hvordan kontantstrømmen din faktisk ser ut
                                    per måned.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>

                    <Card>
                        <CardHeader className='flex flex-row items-start gap-3'>
                            <div className='rounded-full bg-brandBlue/90 p-2 text-brandOrange'>
                                <PiggyBank className='h-5 w-5' />
                            </div>
                            <div>
                                <CardTitle>Plan for sparing</CardTitle>
                                <CardDescription>
                                    Følg egenkapital over tid og se hvordan små
                                    justeringer påvirker hvor mye du kan legge
                                    til side.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </div>
            </section>
        </div>
    );
}
