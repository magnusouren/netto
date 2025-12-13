'use client';

import Link from 'next/link';
import {
    Calculator,
    HandCoins,
    PiggyBank,
    Sparkles,
    TrendingUp,
} from 'lucide-react';

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
import { generatePaymentPlan } from '@/lib/monthlyPaymentPlan';
import { CashflowAreaChart } from '@/components/cashflow-area-chart';

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

    const totalIncomeAnnual = data.incomes.reduce(
        (sum, income) => sum + income.amount,
        0
    );
    const monthlyIncomeGross = totalIncomeAnnual / 12;

    const tax = calculateAnnualTaxes(data);
    const monthlyTax = tax.totalTaxes / 12;
    const effectiveTaxRate = tax.effectiveTaxRate;

    const loans: Loan[] = [...data.loans, ...data.housingLoans];
    const loanMonthlyPayments = loans.reduce(
        (sum, loan) => sum + monthlyLoanPayment(loan),
        0
    );

    const housingFixed = data.fixedExpenses
        .filter((exp) => exp.category === 'housing')
        .reduce((sum, exp) => sum + exp.amount, 0);
    const personalFixed = data.fixedExpenses
        .filter((exp) => exp.category === 'personal')
        .reduce((sum, exp) => sum + exp.amount, 0);
    const livingMonthly = data.livingCosts.reduce(
        (sum, cost) => sum + cost.amount,
        0
    );

    const totalMonthlyExpenses =
        housingFixed + personalFixed + livingMonthly + loanMonthlyPayments;
    const netMonthlyIncome = monthlyIncomeGross - monthlyTax;
    const cashflow = netMonthlyIncome - totalMonthlyExpenses;

    const paymentPlan = generatePaymentPlan(
        data,
        0,
        new Date().toISOString().slice(0, 10),
        3
    );

    const hasData =
        data.incomes.length > 0 ||
        data.housingLoans.length > 0 ||
        data.loans.length > 0 ||
        data.fixedExpenses.length > 0 ||
        data.livingCosts.length > 0;

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
                            <Link href='/tax'>Se skattekalkulator</Link>
                        </Button>
                        <Button asChild variant='outline'>
                            <Link href='/plan'>Egenkapital-plan</Link>
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

            <section className='space-y-4'>
                <TypographyH2>Nøkkeltall fra dine data</TypographyH2>
                <TypographyP>
                    Har du lagt inn inntekter, lån eller utgifter, viser vi et
                    raskt overblikk under.
                </TypographyP>

                {hasData ? (
                    <div className='space-y-6'>
                        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                            <Card className='bg-linear-to-br from-background to-brandOrange/10'>
                                <CardHeader>
                                    <CardTitle className='text-brandBlue'>
                                        Brutto inntekt / mnd
                                    </CardTitle>
                                    <CardDescription>
                                        Summen av alle inntektskilder.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className='text-2xl font-semibold text-brandBlue'>
                                    {formatNumberToNOK(monthlyIncomeGross)}
                                </CardContent>
                            </Card>

                            <Card className='bg-linear-to-br from-background to-brandOrange/10'>
                                <CardHeader>
                                    <CardTitle>Skatt / mnd</CardTitle>
                                    <CardDescription>
                                        Beregnede skatter og avgifter.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className='text-2xl font-semibold text-brandBlue'>
                                    {formatNumberToNOK(monthlyTax)}
                                </CardContent>
                            </Card>

                            <Card className='bg-linear-to-br from-background to-brandOrange/10'>
                                <CardHeader>
                                    <CardTitle>Totale utgifter / mnd</CardTitle>
                                    <CardDescription>
                                        Lån, faste kostnader og levekostnader.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className='text-2xl font-semibold text-brandBlue'>
                                    {formatNumberToNOK(totalMonthlyExpenses)}
                                </CardContent>
                            </Card>

                            <Card className='bg-linear-to-br from-background to-brandOrange/10'>
                                <CardHeader>
                                    <CardTitle>Kontantstrøm / mnd</CardTitle>
                                    <CardDescription>
                                        Det du har igjen etter skatt og utgifter.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className='text-2xl font-semibold text-brandBlue'>
                                    {formatNumberToNOK(cashflow)}
                                </CardContent>
                            </Card>

                            <Card className='bg-linear-to-br from-background to-brandOrange/10'>
                                <CardHeader>
                                    <CardTitle>Aktive lån</CardTitle>
                                    <CardDescription>
                                        Antall lån og boliglån registrert.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className='text-2xl font-semibold text-brandBlue'>
                                    {loans.length}
                                </CardContent>
                            </Card>

                            <Card className='bg-linear-to-br from-background to-brandOrange/10'>
                                <CardHeader>
                                    <CardTitle>Effektiv skattesats</CardTitle>
                                    <CardDescription>
                                        Din beregnede gjennomsnittsskatt.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className='text-2xl font-semibold text-brandBlue'>
                                    {effectiveTaxRate.toFixed(1)} %
                                </CardContent>
                            </Card>

                            <Card className='bg-linear-to-br from-background to-brandOrange/10'>
                                <CardHeader>
                                    <CardTitle>Nedbetaling denne måneden</CardTitle>
                                    <CardDescription>
                                        Sparing på boliglån i inneværende måned.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className='text-2xl font-semibold text-brandBlue'>
                                    {formatNumberToNOK(
                                        paymentPlan[0].totalPrincipal
                                    )}
                                </CardContent>
                            </Card>

                            <Card className='bg-linear-to-br from-background to-brandOrange/10'>
                                <CardHeader>
                                    <CardTitle>
                                        Netto regnskap denne måneden
                                    </CardTitle>
                                    <CardDescription>
                                        Cashflow + nedbetaling på lån.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className='text-2xl font-semibold text-brandBlue'>
                                    {formatNumberToNOK(
                                        paymentPlan[0].balancePlusPrincipal
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <CashflowAreaChart
                            data={paymentPlan.map((item) => ({
                                month: item.month,
                                income: item.income,
                                expenses: item.expenses,
                                balance: item.balance,
                            }))}
                            title='12 mnd. frem i tid'
                        />
                    </div>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle>Ingen nøkkeltall ennå</CardTitle>
                            <CardDescription>
                                Legg inn inntekter, lån og utgifter under
                                «Grunnlagsdata» så fylles nøkkeltallene
                                automatisk ut.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button asChild>
                                <Link href='/data'>
                                    Start med å legge inn data
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>
        </div>
    );
}
