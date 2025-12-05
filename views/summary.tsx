import { TypographyH2 } from '@/components/typography/typographyH2';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { calculateAnnualTaxes } from '@/lib/calcTaxes';
import { computeLoanAmortization } from '@/lib/amortization';
import useStore, { StoreState } from '@/lib/store';
import { formatNumberToNOK } from '@/lib/utils';
import type { Loan } from '@/types';
import {
    ArrowUpCircle,
    Home,
    PiggyBank,
    ReceiptText,
    Wallet,
} from 'lucide-react';

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

export default function Summary() {
    const data = useStore((s: StoreState) => s.data);

    const priceGrowth = 2; // annual % used for housing appreciation snapshot

    // Income
    const totalIncomeAnnual = data.incomes.reduce((s, i) => s + i.amount, 0);
    const taxFreeIncome = data.incomes
        .filter((inc) => inc.taxFree)
        .reduce((s, i) => s + i.amount, 0);
    const monthlyIncomeGross = totalIncomeAnnual / 12;

    const tax = calculateAnnualTaxes(data);
    const monthlyTax = tax.totalTaxes / 12;
    const netMonthlyIncome = monthlyIncomeGross - monthlyTax;

    // Loans
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

    // Fixed expenses
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
        <section className='w-full my-8 space-y-6'>
            <div className='flex items-center gap-3 flex-wrap'>
                <TypographyH2>Oppsummering</TypographyH2>
                <Badge variant='secondary' className='text-xs'>
                    Månedlig oversikt
                </Badge>
            </div>

            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
                <Card className='border-primary/20 shadow-sm'>
                    <CardHeader className='pb-2'>
                        <CardDescription className='flex items-center gap-2 text-xs uppercase tracking-wide'>
                            <ArrowUpCircle className='h-4 w-4 text-brandBlue' />
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
                            <PiggyBank className='h-4 w-4 text-brandBlue' />
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
                            <Wallet className='h-4 w-4 text-brandBlue' />
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

            <Card className='border-primary/20'>
                <CardHeader className='space-y-1'>
                    <CardTitle className='flex items-center gap-2'>
                        <ArrowUpCircle className='h-5 w-5 text-brandBlue' />
                        Inntekter
                    </CardTitle>
                    <CardDescription>
                        Både skattepliktige og skattefrie kilder, vist per
                        måned.
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-3'>
                    <div className='flex flex-wrap gap-3 text-sm text-muted-foreground'>
                        <span>Skattepliktig: {fmt((totalIncomeAnnual - taxFreeIncome) / 12)}</span>
                        <Separator orientation='vertical' className='hidden sm:block h-4' />
                        <span>Skattefritt: {fmt(taxFreeIncome / 12)}</span>
                        <Separator orientation='vertical' className='hidden sm:block h-4' />
                        <span>Skatt per mnd: {fmt(monthlyTax)}</span>
                    </div>
                    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                        {data.incomes.map((income, idx) => (
                            <div
                                key={idx}
                                className='rounded-lg border bg-muted/20 p-3 flex items-center justify-between'
                            >
                                <div>
                                    <p className='text-sm font-medium'>{income.source}</p>
                                    <p className='text-xs text-muted-foreground'>
                                        {income.taxFree ? 'Skattefritt' : 'Skattepliktig'}
                                    </p>
                                </div>
                                <div className='text-right'>
                                    <p className='text-sm font-semibold'>
                                        {fmt(income.amount / 12)}
                                    </p>
                                    <p className='text-[11px] text-muted-foreground'>
                                        {fmt(income.amount)} / år
                                    </p>
                                </div>
                            </div>
                        ))}
                        {data.incomes.length === 0 && (
                            <p className='text-sm text-muted-foreground'>Legg til inntekter for å se fordeling.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card className='border-primary/20'>
                <CardHeader className='space-y-1'>
                    <CardTitle className='flex items-center gap-2'>
                        <ReceiptText className='h-5 w-5 text-brandBlue' />
                        Utgifter
                    </CardTitle>
                    <CardDescription>
                        Grupperte faste kostnader og lån, inkludert renter,
                        avdrag og gebyrer.
                    </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                    <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                        <div className='rounded-lg border bg-muted/20 p-3'>
                            <p className='text-xs uppercase text-muted-foreground'>
                                Renter
                            </p>
                            <p className='text-lg font-semibold'>
                                {fmt(loanMonthlyTotals.interest)}
                            </p>
                        </div>
                        <div className='rounded-lg border bg-muted/20 p-3'>
                            <p className='text-xs uppercase text-muted-foreground'>
                                Avdrag
                            </p>
                            <p className='text-lg font-semibold'>
                                {fmt(loanMonthlyTotals.principal)}
                            </p>
                        </div>
                        <div className='rounded-lg border bg-muted/20 p-3'>
                            <p className='text-xs uppercase text-muted-foreground'>
                                Gebyrer
                            </p>
                            <p className='text-lg font-semibold'>
                                {fmt(loanMonthlyTotals.fees)}
                            </p>
                        </div>
                        <div className='rounded-lg border bg-muted/20 p-3'>
                            <p className='text-xs uppercase text-muted-foreground'>
                                Faste kostnader
                            </p>
                            <p className='text-lg font-semibold'>
                                {fmt(housingFixed + personalFixed + livingMonthly)}
                            </p>
                        </div>
                    </div>

                    <Separator />

                    <div className='space-y-3'>
                        <p className='text-sm font-semibold text-muted-foreground'>
                            Faste utgifter
                        </p>
                        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                            <div className='rounded-lg border bg-background p-3'>
                                <p className='text-sm'>Bolig</p>
                                <p className='text-lg font-semibold'>{fmt(housingFixed)}</p>
                            </div>
                            <div className='rounded-lg border bg-background p-3'>
                                <p className='text-sm'>Personlig</p>
                                <p className='text-lg font-semibold'>{fmt(personalFixed)}</p>
                            </div>
                            <div className='rounded-lg border bg-background p-3'>
                                <p className='text-sm'>Levekostnader</p>
                                <p className='text-lg font-semibold'>{fmt(livingMonthly)}</p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className='space-y-3'>
                        <p className='text-sm font-semibold text-muted-foreground'>
                            Lån
                        </p>
                        <div className='space-y-2'>
                            {loanSummaries.map(({ loan, interest, principal, fee, total }, idx) => (
                                <div
                                    key={idx}
                                    className='flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border bg-background p-3 gap-2'
                                >
                                    <div className='space-y-1'>
                                        <p className='text-sm font-medium'>{loan.description}</p>
                                        <p className='text-xs text-muted-foreground'>
                                            {fmt(interest)} renter · {fmt(principal)} avdrag · {fmt(fee)} gebyr
                                        </p>
                                    </div>
                                    <div className='text-right'>
                                        <p className='text-sm font-semibold'>{fmt(total)} / mnd</p>
                                        <p className='text-[11px] text-muted-foreground'>
                                            {loan.termYears} år · {(loan.interestRate || 0).toFixed(2)}%
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {loanSummaries.length === 0 && (
                                <p className='text-sm text-muted-foreground'>Legg til lån for å se betalingene fordelt.</p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className='border-primary/20'>
                <CardHeader className='space-y-1'>
                    <CardTitle className='flex items-center gap-2'>
                        <Home className='h-5 w-5 text-brandBlue' />
                        Boligkapital og prisvekst
                    </CardTitle>
                    <CardDescription>
                        Viser månedlig avdrag og estimert prisvekst på boliger
                        du betaler ned på.
                    </CardDescription>
                </CardHeader>
                <CardContent className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                    {housingHighlights.map((item, idx) => (
                        <div
                            key={idx}
                            className='rounded-lg border bg-muted/20 p-3 space-y-2'
                        >
                            <div className='flex items-center justify-between'>
                                <p className='text-sm font-semibold'>{item.description}</p>
                                <Badge variant='outline' className='text-xs'>
                                    {priceGrowth}% årlig
                                </Badge>
                            </div>
                            <div className='flex items-center justify-between text-sm'>
                                <span className='text-muted-foreground'>Avdrag</span>
                                <span className='font-medium'>{fmt(item.principal)}</span>
                            </div>
                            <div className='flex items-center justify-between text-sm'>
                                <span className='text-muted-foreground'>Prisvekst</span>
                                <span className='font-medium'>{fmt(item.priceGrowth)}</span>
                            </div>
                            <Separator />
                            <div className='flex items-center justify-between text-sm font-semibold'>
                                <span>EK-vekst per mnd</span>
                                <span>{fmt(item.combined)}</span>
                            </div>
                        </div>
                    ))}
                    {housingHighlights.length === 0 && (
                        <p className='text-sm text-muted-foreground'>Legg til boliglån for å se verdiutvikling.</p>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
