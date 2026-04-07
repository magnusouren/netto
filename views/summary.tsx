import { TypographyH2 } from '@/components/typography/typographyH2';
import useStore, { StoreState } from '@/lib/store';
import type { Loan, HouseMonthlyCosts } from '@/types';
import { calculateAnnualTaxes } from '@/lib/calcTaxes';

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

export default function Summary() {
    const data = useStore((s: StoreState) => s.data);

    // Get active house
    const activeHouse = (data.houses || []).find(
        (h) => h.id === data.activeHouseId
    );

    // ---- Income ----
    const totalIncomeAnnual = (data.incomes || []).reduce(
        (s, i) => s + i.amount,
        0
    );
    const monthlyIncomeGross = totalIncomeAnnual / 12;

    // ---- TAX ----
    const tax = calculateAnnualTaxes(data);
    const monthlyTax = tax.totalTaxes / 12;

    // ---- Loan monthly payments ----
    // Regular loans + active house's housing loan
    const allLoans: Loan[] = [
        ...data.loans,
        ...(activeHouse ? [activeHouse.housingLoan] : []),
    ];
    const loanMonthlyPayments = allLoans.reduce(
        (s, l) => s + monthlyLoanPayment(l),
        0
    );

    // ---- Fixed monthly expenses ----
    // Housing costs from active house
    const housingFixed = activeHouse
        ? totalHouseMonthlyCosts(activeHouse.houseMonthlyCosts)
        : 0;

    // Personal fixed expenses
    const personalFixed = (data.personalFixedExpenses || []).reduce(
        (s, f) => s + f.amount,
        0
    );

    // Living costs
    const livingMonthly = (data.livingCosts || []).reduce(
        (s, l) => s + l.amount,
        0
    );

    const totalMonthlyExpenses =
        housingFixed + personalFixed + livingMonthly + loanMonthlyPayments;

    const balance = monthlyIncomeGross - monthlyTax - totalMonthlyExpenses;

    function fmt(n: number) {
        return Math.round(n).toLocaleString('nb-NO');
    }

    return (
        <section className='w-full my-8'>
            <TypographyH2>Oppsummering</TypographyH2>

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
                            <td className='p-2'>Skatt per måned</td>
                            <td className='p-2 text-right'>
                                {fmt(monthlyTax)}
                            </td>
                        </tr>

                        <tr className='border-t italic'>
                            <td className='p-2'>Netto månedslønn</td>
                            <td className='p-2 text-right'>
                                {fmt(monthlyIncomeGross - monthlyTax)}
                            </td>
                        </tr>

                        <tr className='mt-4'>
                            <td className='p-2 font-semibold' colSpan={2}>
                            </td>
                        </tr>


                        <tr className='mt-4'>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Utgifter
                            </td>
                        </tr>

                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Faste personlige kostnader</td>
                            <td className='p-2 text-right'>
                                {fmt(personalFixed)}
                            </td>
                        </tr>

                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Variable kostnader</td>
                            <td className='p-2 text-right'>
                                {fmt(livingMonthly)}
                            </td>
                        </tr>

                        {data.loans.map((loan, i) => (
                            <tr
                                key={i}
                            >
                                <td className='p-2'>Terminbeløp - {loan.description}</td>
                                <td className='p-2 text-right'>
                                    {fmt(loan.loanAmount > 0 ? monthlyLoanPayment(loan) : 0)}
                                </td>
                            </tr>
                        ))}

                        <tr className='mt-4'>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Boligkostnader
                                {activeHouse && (
                                    <span className='font-normal text-muted-foreground ml-2'>
                                        (ved kjøp av {activeHouse.name})
                                    </span>
                                )}
                            </td>
                        </tr>

                        {activeHouse?.housingLoan && (
                            <tr>
                                <td className='p-2'>
                                    Terminbeløp - {activeHouse.housingLoan.description}
                                </td>
                                <td className='p-2 text-right'>
                                    {fmt(
                                        monthlyLoanPayment(
                                            activeHouse.housingLoan
                                        )
                                    )}
                                </td>
                            </tr>
                        )}

                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Faste utgifter - bolig</td>
                            <td className='p-2 text-right'>
                                {fmt(housingFixed)}
                            </td>
                        </tr>

                        <tr className='border-t italic'>
                            <td className='p-2'>Sum månedlige utgifter</td>
                            <td className='p-2 text-right'>
                                {fmt(totalMonthlyExpenses)}
                            </td>
                        </tr>

                        <tr className='mt-4'>
                            <td className='p-2 font-semibold' colSpan={2}>
                            </td>
                        </tr>

                        <tr className='mt-4'>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Oppsummering
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Netto månedslønn</td>
                            <td className='p-2 text-right'>
                                {fmt(monthlyIncomeGross - monthlyTax)}
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Sum månedlige utgifter</td>
                            <td className='p-2 text-right'>
                                {fmt(totalMonthlyExpenses)}
                            </td>
                        </tr>

                        <tr className='font-bold mt-2 border-t'>
                            <td className='p-2'>
                                Disponibelt beløp per måned
                            </td>
                            <td className='p-2 text-right'>{fmt(balance)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
}
