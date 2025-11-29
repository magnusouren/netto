import React from 'react';
import useStore, { StoreState } from '@/lib/store';
import type { Loan } from '@/types';

function monthlyLoanPayment(loan: Loan): number {
    const principal = loan.loanAmount || 0;
    const termsPerYear = loan.termsPerYear || 12;
    const termYears = loan.termYears || 0;
    const n = termYears * termsPerYear;
    if (n <= 0 || principal <= 0) return 0;

    const r = (loan.interestRate || 0) / 100 / termsPerYear; // rate per term

    let paymentPerTerm = 0;
    if (r === 0) paymentPerTerm = principal / n;
    else paymentPerTerm = (principal * r) / (1 - Math.pow(1 + r, -n));

    // convert to monthly
    const monthly =
        paymentPerTerm * (12 / termsPerYear) + (loan.monthlyFee || 0);
    return monthly;
}

export default function Summary() {
    const data = useStore((s: StoreState) => s.data);
    // Annual / monthly incomes
    const totalIncomeAnnual = data.incomes.reduce((s, i) => s + i.amount, 0);
    const monthlyIncomeGross = totalIncomeAnnual / 12;

    // Minstefradrag (annual)
    const minstefradragAnnual = Math.min(totalIncomeAnnual * 0.46, 92000);

    // Loan interest (approx) and rentefradrag (22%) - annual
    const loans: Loan[] = [...data.loans, ...data.housingLoans];
    const loanInterestAnnual = loans.reduce(
        (s, l) => s + ((l.loanAmount || 0) * (l.interestRate || 0)) / 100,
        0
    );
    const rentefradragAnnual = loanInterestAnnual * 0.22;

    // Deductions used for tax calculation
    const totalDeductionsAnnual = minstefradragAnnual + rentefradragAnnual;

    // --- Tax calculation (same formula used in taxes.tsx) ---
    const inntekt = totalIncomeAnnual;
    const fradrag = totalDeductionsAnnual;
    const alminnelig = Math.max(inntekt - fradrag, 0);
    const skatt_alminnelig = alminnelig * 0.1772;
    const trygdeavgift = inntekt * 0.077;
    const trinn1 = Math.max(Math.min(inntekt, 306050) - 217400, 0) * 0.017;
    const trinn2 = Math.max(Math.min(inntekt, 697150) - 306050, 0) * 0.04;
    const trinn3 = Math.max(Math.min(inntekt, 942400) - 697150, 0) * 0.137;
    const trinn4 = Math.max(Math.min(inntekt, 1410750) - 942400, 0) * 0.167;
    const trinn5 = Math.max(inntekt - 1410750, 0) * 0.177;
    const trinnskatt = trinn1 + trinn2 + trinn3 + trinn4 + trinn5;
    const taxAnnual = skatt_alminnelig + trygdeavgift + trinnskatt;
    const monthlyTax = taxAnnual / 12;

    // Fixed expenses grouped per category (assume amounts are monthly)
    const housingFixed = data.fixedExpenses
        .filter((f) => f.category === 'housing')
        .reduce((s, f) => s + f.amount, 0);
    const personalFixed = data.fixedExpenses
        .filter((f) => f.category === 'personal')
        .reduce((s, f) => s + f.amount, 0);

    // Living costs (assume monthly)
    const livingMonthly = data.livingCosts.reduce((s, l) => s + l.amount, 0);

    // Loan monthly payments
    const loanMonthlyPayments = loans.reduce(
        (s, l) => s + monthlyLoanPayment(l),
        0
    );

    const totalMonthlyExpenses =
        housingFixed +
        personalFixed +
        livingMonthly +
        loanMonthlyPayments +
        monthlyTax;

    const netMonthly = monthlyIncomeGross - totalMonthlyExpenses;

    function fmt(n: number) {
        return Math.round(n).toLocaleString();
    }

    return (
        <section className='w-full my-8'>
            <div className='flex items-center justify-between mb-2'>
                <h2 className='text-2xl font-semibold'>Månedsoppsummering</h2>
            </div>

            <div className='overflow-auto rounded-md border'>
                <table className='w-full table-fixed text-sm'>
                    <thead>
                        <tr className='bg-muted'>
                            <th className='p-2 text-left'>Kategori</th>
                            <th className='p-2 text-right'>Per måned (kr)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className='mt-4'>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Inntekter
                            </td>
                        </tr>
                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Brutto inntekt</td>
                            <td className='p-2 text-right'>
                                {fmt(monthlyIncomeGross)}
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Skatt å betale per måned</td>
                            <td className='p-2 text-right'>
                                {fmt(monthlyTax)}
                            </td>
                        </tr>

                        <tr className='border-t font-semibold'>
                            <td className='p-2'>Netto inntekt</td>
                            <td className='p-2 text-right'>
                                {fmt(monthlyIncomeGross - monthlyTax)}
                            </td>
                        </tr>

                        <tr className='mt-4'>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Månedlige utgifter
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Lån - månedlige betalinger</td>
                            <td className='p-2 text-right'>
                                {fmt(loanMonthlyPayments)}
                            </td>
                        </tr>

                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Faste utgifter - bolig</td>
                            <td className='p-2 text-right'>
                                {fmt(housingFixed)}
                            </td>
                        </tr>

                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Faste utgifter - personlig</td>
                            <td className='p-2 text-right'>
                                {fmt(personalFixed)}
                            </td>
                        </tr>

                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Levekostnader (sum)</td>
                            <td className='p-2 text-right'>
                                {fmt(livingMonthly)}
                            </td>
                        </tr>

                        <tr className='font-semibold'>
                            <td className='p-2'>Totale månedlige utgifter</td>
                            <td className='p-2 text-right'>
                                {fmt(totalMonthlyExpenses)}
                            </td>
                        </tr>

                        <tr className='mt-4 border-t'>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Oppsummering
                            </td>
                        </tr>

                        <tr className='text-lg font-bold bg-muted/10'>
                            <td className='p-2'>Balanse per måned</td>
                            <td className='p-2 text-right'>
                                {fmt(netMonthly)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
}
