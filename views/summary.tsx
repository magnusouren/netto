'use client';

import { Glance } from '@/components/ledger/Glance';
import useStore, { StoreState } from '@/lib/store';
import { calculateAnnualTaxes } from '@/lib/calcTaxes';
import { formatNumberToNOK } from '@/lib/utils';
import type { Loan, HouseMonthlyCosts } from '@/types';

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

const fmt = (n: number) => formatNumberToNOK(Math.round(n));

export default function Summary() {
    const data = useStore((s: StoreState) => s.data);

    const activeHouse = (data.houses || []).find(
        (h) => h.id === data.activeHouseId
    );

    const totalIncomeAnnual = (data.incomes || []).reduce(
        (s, i) => s + i.amount,
        0
    );
    const monthlyIncomeGross = totalIncomeAnnual / 12;

    const tax = calculateAnnualTaxes(data);
    const monthlyTax = tax.totalTaxes / 12;

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

    const personalLoansMonthly = data.loans.reduce(
        (s, l) => s + (l.loanAmount > 0 ? monthlyLoanPayment(l) : 0),
        0
    );
    const housingLoanMonthly = activeHouse
        ? monthlyLoanPayment(activeHouse.housingLoan)
        : 0;

    const totalMonthlyExpenses =
        housingFixed +
        personalFixed +
        livingMonthly +
        personalLoansMonthly +
        housingLoanMonthly;

    const balance = monthlyIncomeGross - monthlyTax - totalMonthlyExpenses;

    return (
        <section className='w-full my-8'>
            <Glance
                density='compact'
                title='Oppsummering'
                subtitle='Månedlig kontantstrøm'
                indexLabel={
                    activeHouse ? `Med ${activeHouse.name}` : 'Uten bolig'
                }
                footnote={
                    <>
                        <span>Netto inntekt − sum utgifter</span>
                        <span className='font-mono tabular-nums'>
                            {fmt(monthlyIncomeGross - monthlyTax)} −{' '}
                            {fmt(totalMonthlyExpenses)}
                        </span>
                    </>
                }
            >
                <Glance.Section>Inntekter</Glance.Section>
                <Glance.Row
                    label='Brutto inntekt'
                    value={'+ ' + fmt(monthlyIncomeGross)}
                />
                <Glance.Row
                    label='Skatt per måned'
                    value={'− ' + fmt(monthlyTax)}
                />

                <Glance.Section>Utgifter</Glance.Section>
                <Glance.Row
                    label='Faste personlige kostnader'
                    value={'− ' + fmt(personalFixed)}
                />
                <Glance.Row
                    label='Variable kostnader'
                    value={'− ' + fmt(livingMonthly)}
                />
                {data.loans.map((loan, i) => (
                    <Glance.Row
                        key={`loan-${i}`}
                        label={`Terminbeløp · ${loan.description}`}
                        value={
                            '− ' +
                            fmt(loan.loanAmount > 0 ? monthlyLoanPayment(loan) : 0)
                        }
                    />
                ))}

                {activeHouse && (
                    <>
                        <Glance.Section>
                            Boligkostnader · {activeHouse.name}
                        </Glance.Section>
                        <Glance.Row
                            label={`Terminbeløp · ${activeHouse.housingLoan.description}`}
                            value={'− ' + fmt(housingLoanMonthly)}
                        />
                        <Glance.Row
                            label='Faste utgifter · bolig'
                            value={'− ' + fmt(housingFixed)}
                        />
                    </>
                )}

                <Glance.Total
                    label='Disponibelt per måned'
                    value={
                        <span
                            className={
                                balance >= 0
                                    ? 'text-emerald-600'
                                    : 'text-destructive'
                            }
                        >
                            {(balance >= 0 ? '+ ' : '− ') +
                                fmt(Math.abs(balance))}
                        </span>
                    }
                />
            </Glance>
        </section>
    );
}
