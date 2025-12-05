import { TypographyH2 } from '@/components/typography/typographyH2';
import useStore, { StoreState } from '@/lib/store';
import { calculateAnnualTaxes } from '@/lib/calcTaxes';
import { generatePaymentPlan } from '@/lib/monthlyPaymentPlan';

export default function Summary() {
    const data = useStore((s: StoreState) => s.data);

    // ---- Income ----
    const totalIncomeAnnual = data.incomes.reduce((s, i) => s + i.amount, 0);
    const monthlyIncomeGross = totalIncomeAnnual / 12;

    const annualTaxableIncome = data.incomes
        .filter((income) => !income.taxFree)
        .reduce((sum, income) => sum + income.amount, 0);

    const taxInput = {
        ...data,
        incomes: [
            {
                source: 'Taxable Income',
                amount: annualTaxableIncome,
            },
        ],
    };

    // ---- TAX (NEW: use your function) ----
    const tax = calculateAnnualTaxes(taxInput);
    const monthlyTax = tax.totalTaxes / 12;

    const startDate = new Date();
    startDate.setDate(1);
    const [currentMonthPlan] = generatePaymentPlan(
        data,
        0,
        startDate.toISOString().slice(0, 10),
        1
    );

    const loanMonthlyPayments =
        (currentMonthPlan?.totalInterest ?? 0) +
        (currentMonthPlan?.totalPrincipal ?? 0);

    const housingFixed = data.fixedExpenses
        .filter((f) => f.category === 'housing')
        .reduce((s, f) => s + f.amount, 0);

    const personalFixed = data.fixedExpenses
        .filter((f) => f.category === 'personal')
        .reduce((s, f) => s + f.amount, 0);

    const livingMonthly = data.livingCosts.reduce((s, l) => s + l.amount, 0);

    const totalMonthlyExpenses = currentMonthPlan?.expenses
        ? currentMonthPlan.expenses
        : housingFixed + personalFixed + livingMonthly + loanMonthlyPayments;

    const balance = currentMonthPlan?.balance
        ? currentMonthPlan.balance
        : monthlyIncomeGross - monthlyTax - totalMonthlyExpenses;

    function fmt(n: number) {
        return Math.round(n).toLocaleString();
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
                            <td className='p-2'>Levekostnader</td>
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
                            <td className='p-2'>
                                Balanse per måned (cash flow)
                            </td>
                            <td className='p-2 text-right'>{fmt(balance)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
}
