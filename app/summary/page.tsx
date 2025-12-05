'use client';

import {
    ArrowUpCircle,
    BadgeDollarSign,
    BarChart4,
    Home,
    PiggyBank,
    ReceiptText,
    ShieldCheck,
    Sparkles,
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
import { computeLoanAmortization } from '@/lib/amortization';
import { calculateAnnualTaxes } from '@/lib/calcTaxes';
import useStore, { StoreState } from '@/lib/store';
import { formatNumberToNOK } from '@/lib/utils';
import type { Loan } from '@/types';

function monthlyLoanBreakdown(loan: Loan) {
    const amort = computeLoanAmortization(loan);
    const firstMonth = amort.monthly[0];

    if (!firstMonth) {
        return { interest: 0, principal: 0, fee: loan.monthlyFee || 0 };
    }

    return {
        interest: firstMonth.interest,
        principal: firstMonth.principal,
        fee: firstMonth.fee,
    };
}

export default function SummaryPage() {
    const data = useStore((s: StoreState) => s.data);

    const priceGrowth = 2; // annual % used for housing appreciation snapshot

    const totalIncomeAnnual = data.incomes.reduce((s, i) => s + i.amount, 0);
    const taxFreeIncome = data.incomes
        .filter((inc) => inc.taxFree)
        .reduce((s, i) => s + i.amount, 0);
    const monthlyIncomeGross = totalIncomeAnnual / 12;

    const tax = calculateAnnualTaxes(data);
    const monthlyTax = tax.totalTaxes / 12;
    const netMonthlyIncome = monthlyIncomeGross - monthlyTax;

    const loans: Loan[] = [...data.loans, ...data.housingLoans];
    const loanSummaries = loans.map((loan) => {
        const breakdown = monthlyLoanBreakdown(loan);
        const total =
            ((loan.interestRate || 0) >= 0 ? breakdown.principal : 0) +
            breakdown.interest +
            breakdown.fee;

        return { loan, ...breakdown, total };
    });

    const loanMonthlyTotals = loanSummaries.reduce(
        (acc, item) => {
            acc.interest += item.interest;
            acc.principal += item.principal;
            acc.fees += item.fee;
            acc.total += item.total;
            return acc;
        },
        { interest: 0, principal: 0, fees: 0, total: 0 }
    );

    const housingFixed = data.fixedExpenses
        .filter((f) => f.category === 'housing')
        .reduce((s, f) => s + f.amount, 0);
    const personalFixed = data.fixedExpenses
        .filter((f) => f.category === 'personal')
        .reduce((s, f) => s + f.amount, 0);
    const livingMonthly = data.livingCosts.reduce((s, l) => s + l.amount, 0);

    const totalMonthlyExpenses =
        housingFixed +
        personalFixed +
        livingMonthly +
        loanMonthlyTotals.total;

    const balance = netMonthlyIncome - totalMonthlyExpenses;

    const housingHighlights = data.housingLoans.map((loan) => {
        const { principal } = monthlyLoanBreakdown(loan);
        const baseValue = loan.loanAmount + loan.capital;
        const monthlyGrowthRate = Math.pow(1 + priceGrowth / 100, 1 / 12) - 1;
        const priceGrowthNOK = baseValue * monthlyGrowthRate;

        return {
            description: loan.description,
            principal,
            priceGrowth: priceGrowthNOK,
            combined: principal + priceGrowthNOK,
        };
    });

    const fmt = (value: number) => formatNumberToNOK(Math.round(value));

    return (
        <div className='py-10 space-y-10'>
            <section className='space-y-4'>
                <div className='flex flex-wrap items-center gap-3'>
                    <Badge variant='outline' className='text-brandBlue bg-brandOrange/15'>
                        <Sparkles className='mr-2 h-4 w-4' />
                        Oppsummering
                    </Badge>
                    <TypographyH1>Din økonomiske status nå</TypographyH1>
                    <TypographyP className='max-w-2xl'>
                        Se alle inntekter, utgifter og lån på ett sted. Vi viser
                        både månedlige beløp og hvordan boliglån bygger egenkapital
                        gjennom avdrag og prisvekst.
                    </TypographyP>
                </div>

                <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                    <Card className='border-primary/20 shadow-sm'>
                        <CardHeader className='pb-2'>
                            <CardDescription className='flex items-center gap-2 text-xs uppercase tracking-wide'>
                                <PiggyBank className='h-4 w-4 text-brandBlue' />
                                Netto inntekt / mnd
                            </CardDescription>
                            <CardTitle className='text-2xl'>
                                {fmt(netMonthlyIncome)}
                            </CardTitle>
                            <p className='text-xs text-muted-foreground'>
                                Etter skatt ({tax.effectiveTaxRate.toFixed(1)}% sats)
                            </p>
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
                            <p className='text-xs text-muted-foreground'>
                                Inkluderer renter, avdrag og gebyrer
                            </p>
                        </CardHeader>
                    </Card>

                    <Card className='border-primary/20 shadow-sm'>
                        <CardHeader className='pb-2'>
                            <CardDescription className='flex items-center gap-2 text-xs uppercase tracking-wide'>
                                <Wallet className='h-4 w-4 text-brandBlue' />
                                Kontantstrøm
                            </CardDescription>
                            <CardTitle className='text-2xl'>
                                {fmt(balance)}
                            </CardTitle>
                            <p className='text-xs text-muted-foreground'>
                                Penger igjen til sparing og buffer
                            </p>
                        </CardHeader>
                    </Card>

                    <Card className='border-primary/20 shadow-sm'>
                        <CardHeader className='pb-2'>
                            <CardDescription className='flex items-center gap-2 text-xs uppercase tracking-wide'>
                                <ArrowUpCircle className='h-4 w-4 text-brandBlue' />
                                Brutto inntekt / mnd
                            </CardDescription>
                            <CardTitle className='text-2xl'>
                                {fmt(monthlyIncomeGross)}
                            </CardTitle>
                            <p className='text-xs text-muted-foreground'>
                                Før skatt og fradrag
                            </p>
                        </CardHeader>
                    </Card>
                </div>
            </section>

            <section className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
                <Card className='border-primary/20'>
                    <CardHeader className='space-y-1'>
                        <CardTitle className='flex items-center gap-2'>
                            <BadgeDollarSign className='h-5 w-5 text-brandBlue' />
                            Inntekter
                        </CardTitle>
                        <CardDescription>
                            Både skattepliktige og skattefrie kilder, vist per måned.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='flex flex-wrap gap-3 text-sm text-muted-foreground'>
                            <span>Skattepliktig: {fmt((totalIncomeAnnual - taxFreeIncome) / 12)}</span>
                            <Separator orientation='vertical' className='hidden sm:block h-4' />
                            <span>Skattefritt: {fmt(taxFreeIncome / 12)}</span>
                            <Separator orientation='vertical' className='hidden sm:block h-4' />
                            <span>Skatt per mnd: {fmt(monthlyTax)}</span>
                        </div>

                        <div className='grid gap-3 sm:grid-cols-2'>
                            <Card className='border-dashed'>
                                <CardHeader className='pb-2'>
                                    <CardDescription className='text-xs uppercase tracking-wide'>
                                        Skattepliktige inntekter
                                    </CardDescription>
                                    <CardTitle className='text-lg'>
                                        {fmt((totalIncomeAnnual - taxFreeIncome) / 12)}
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
                                                <span className='text-muted-foreground'>{inc.source}</span>
                                                <span className='font-medium'>
                                                    {fmt(inc.amount / 12)}
                                                </span>
                                            </div>
                                        ))}
                                    {data.incomes.filter((i) => !i.taxFree).length === 0 && (
                                        <p className='text-sm text-muted-foreground'>Ingen registrerte inntekter.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className='border-dashed'>
                                <CardHeader className='pb-2'>
                                    <CardDescription className='text-xs uppercase tracking-wide'>
                                        Skattefrie inntekter
                                    </CardDescription>
                                    <CardTitle className='text-lg'>
                                        {fmt(taxFreeIncome / 12)}
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
                                                <span className='text-muted-foreground'>{inc.source}</span>
                                                <span className='font-medium'>
                                                    {fmt(inc.amount / 12)}
                                                </span>
                                            </div>
                                        ))}
                                    {data.incomes.filter((i) => i.taxFree).length === 0 && (
                                        <p className='text-sm text-muted-foreground'>Ingen registrerte skattefrie beløp.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </Card>

                <Card className='border-primary/20'>
                    <CardHeader className='space-y-1'>
                        <CardTitle className='flex items-center gap-2'>
                            <BarChart4 className='h-5 w-5 text-brandBlue' />
                            Nøkkeltall
                        </CardTitle>
                    <CardDescription>
                            Rask oversikt over renter, avdrag og faste utgifter.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>Renter per måned</span>
                            <span className='font-semibold'>
                                {fmt(loanMonthlyTotals.interest)}
                            </span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>Avdrag per måned</span>
                            <span className='font-semibold'>
                                {fmt(loanMonthlyTotals.principal)}
                            </span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>Gebyrer per måned</span>
                            <span className='font-semibold'>
                                {fmt(loanMonthlyTotals.fees)}
                            </span>
                        </div>
                        <Separator />
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>Faste kostnader (bolig)</span>
                            <span className='font-semibold'>{fmt(housingFixed)}</span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>Faste kostnader (personlig)</span>
                            <span className='font-semibold'>{fmt(personalFixed)}</span>
                        </div>
                        <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground'>Levekostnader</span>
                            <span className='font-semibold'>{fmt(livingMonthly)}</span>
                        </div>
                    </CardContent>
                </Card>
            </section>

            <section className='grid gap-6 lg:grid-cols-[1fr_1fr]'>
                <Card className='border-primary/20'>
                    <CardHeader className='space-y-1'>
                        <CardTitle className='flex items-center gap-2'>
                            <ReceiptText className='h-5 w-5 text-brandBlue' />
                            Utgifter og lån
                        </CardTitle>
                        <CardDescription>
                            Hver utgiftskategori med renter, avdrag og gebyrer inkludert.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        <div className='grid gap-3 sm:grid-cols-3'>
                            <div className='rounded-lg border p-3 bg-muted/30'>
                                <p className='text-xs text-muted-foreground uppercase'>Bolig</p>
                                <p className='text-lg font-semibold'>{fmt(housingFixed)}</p>
                            </div>
                            <div className='rounded-lg border p-3 bg-muted/30'>
                                <p className='text-xs text-muted-foreground uppercase'>Personlig</p>
                                <p className='text-lg font-semibold'>{fmt(personalFixed)}</p>
                            </div>
                            <div className='rounded-lg border p-3 bg-muted/30'>
                                <p className='text-xs text-muted-foreground uppercase'>Levekostnader</p>
                                <p className='text-lg font-semibold'>{fmt(livingMonthly)}</p>
                            </div>
                        </div>

                        <div className='space-y-3'>
                            <h3 className='text-sm font-semibold text-muted-foreground'>Lån per måned</h3>
                            <div className='space-y-2'>
                                {loanSummaries.map(({ loan, interest, principal, fee, total }) => (
                                    <div
                                        key={loan.description}
                                        className='rounded-lg border p-3 flex flex-wrap items-center gap-3 justify-between'
                                    >
                                        <div className='space-y-1'>
                                            <p className='text-sm font-medium'>{loan.description}</p>
                                            <p className='text-xs text-muted-foreground'>
                                                Rente {fmt(interest)} · Avdrag {fmt(principal)} · Gebyr {fmt(fee)}
                                            </p>
                                        </div>
                                        <Badge variant='secondary' className='text-xs'>
                                            Totalt {fmt(total)}
                                        </Badge>
                                    </div>
                                ))}
                                {loanSummaries.length === 0 && (
                                    <p className='text-sm text-muted-foreground'>Ingen lån registrert.</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className='border-primary/20'>
                    <CardHeader className='space-y-1'>
                        <CardTitle className='flex items-center gap-2'>
                            <Home className='h-5 w-5 text-brandBlue' />
                            Boligkapital
                        </CardTitle>
                        <CardDescription>
                            Kombiner avdrag og antatt prisvekst ({priceGrowth}% årlig) for å se månedlig egenkapitalvekst.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        {housingHighlights.map((item) => (
                            <div
                                key={item.description}
                                className='rounded-lg border p-3 flex flex-wrap items-center gap-3 justify-between'
                            >
                                <div className='space-y-1'>
                                    <p className='text-sm font-medium'>{item.description}</p>
                                    <p className='text-xs text-muted-foreground'>
                                        Avdrag {fmt(item.principal)} · Prisvekst {fmt(item.priceGrowth)}
                                    </p>
                                </div>
                                <Badge className='bg-brandBlue text-white hover:bg-brandBlue/90'>
                                    +{fmt(item.combined)} / mnd
                                </Badge>
                            </div>
                        ))}
                        {housingHighlights.length === 0 && (
                            <p className='text-sm text-muted-foreground'>Ingen boliglån registrert.</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            <Card className='border-primary/20 bg-linear-to-r from-background to-brandBlue/5'>
                <CardHeader>
                    <CardTitle className='flex items-center gap-2'>
                        <ShieldCheck className='h-5 w-5 text-brandBlue' />
                        Slik leser du tallene
                    </CardTitle>
                    <CardDescription>
                        Vi viser alle beløp per måned for at du enkelt skal kunne sammenligne inntekter, utgifter og egenkapitalvekst.
                    </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                    <div className='rounded-lg border p-4 bg-background'>
                        <p className='text-sm text-muted-foreground'>
                            Inntekt etter skatt gir deg summen du faktisk kan disponere hver måned.
                        </p>
                    </div>
                    <div className='rounded-lg border p-4 bg-background'>
                        <p className='text-sm text-muted-foreground'>
                            Totale utgifter inkluderer både faste kostnader og alle lånekomponenter.
                        </p>
                    </div>
                    <div className='rounded-lg border p-4 bg-background'>
                        <p className='text-sm text-muted-foreground'>
                            Kontantstrøm er differansen mellom netto inntekt og totale utgifter.
                        </p>
                    </div>
                    <div className='rounded-lg border p-4 bg-background'>
                        <p className='text-sm text-muted-foreground'>
                            Boligkapital viser hvordan avdrag kombinert med prisvekst bygger formue over tid.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
