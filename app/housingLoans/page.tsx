'use client';

import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyH3 } from '@/components/typography/typographyH3';
import { TypographyP } from '@/components/typography/typographyP';
import useStore, { StoreState } from '@/lib/store';

// --------------------------------------
// --- Amortization (Annuitetslån) ------
// --------------------------------------

function generateAmortizationSchedule(loan: {
    loanAmount: number;
    interestRate: number;
    termYears: number;
    termsPerYear: number;
    monthlyFee?: number;
}) {
    const {
        loanAmount,
        interestRate,
        termYears,
        termsPerYear,
        monthlyFee = 0,
    } = loan;

    const numberOfTerms = termYears * termsPerYear;
    const ratePerTerm = interestRate / 100 / termsPerYear;

    // Annuitetsbeløp per termin
    const termPayment =
        (loanAmount * ratePerTerm) /
        (1 - Math.pow(1 + ratePerTerm, -numberOfTerms));

    let balance = loanAmount;

    const first12Months: HousingLoanDataRowMonthly[] = [];
    const yearGroups: HousingLoanDataRowYearly[] = [];

    let currentYear = 1;
    let yearInterest = 0;
    let yearPrincipal = 0;
    let yearFees = 0;
    let yearPaid = 0;

    for (let term = 1; term <= numberOfTerms; term++) {
        const interest = balance * ratePerTerm;
        const principal = termPayment - interest;
        balance -= principal;
        if (term === numberOfTerms) balance = 0;

        const payment = termPayment + monthlyFee;

        // Collect month stats
        if (term <= 12) {
            first12Months.push({
                term,
                payment,
                interest,
                principal,
                fee: monthlyFee,
                balance,
            });
        }

        // Accumulate for year summary
        yearInterest += interest;
        yearPrincipal += principal;
        yearFees += monthlyFee;
        yearPaid += payment;

        const endOfYearTerm = currentYear * termsPerYear;

        if (term === endOfYearTerm) {
            yearGroups.push({
                year: currentYear,
                totalInterest: yearInterest,
                totalPrincipal: yearPrincipal,
                totalFees: yearFees,
                totalPaid: yearPaid,
                endBalance: balance,
            });

            // Reset for next year
            currentYear++;
            yearInterest = 0;
            yearPrincipal = 0;
            yearFees = 0;
            yearPaid = 0;
        }
    }

    // Totals across entire loan
    const totals = yearGroups.reduce(
        (acc, y) => {
            acc.totalInterest += y.totalInterest;
            acc.totalPrincipal += y.totalPrincipal;
            acc.totalFees += y.totalFees;
            acc.totalPaid += y.totalPaid;
            return acc;
        },
        {
            totalInterest: 0,
            totalPrincipal: 0,
            totalFees: 0,
            totalPaid: 0,
        }
    );

    return {
        first12Months,
        yearGroups,
        totals,
    };
}

const formatNumberToNOK = (num: number) => {
    return num.toLocaleString('no-NO', {
        style: 'currency',
        currency: 'NOK',
        maximumFractionDigits: 0,
    });
};

interface HousingLoanDataRowMonthly {
    term: number;
    payment: number;
    interest: number;
    principal: number;
    fee: number;
    balance: number;
}

interface HousingLoanDataRowYearly {
    year: number;
    totalInterest: number;
    totalPrincipal: number;
    totalFees: number;
    totalPaid: number;
    endBalance: number;
}

// --------------------------------------
// --- Component ------------------------
// --------------------------------------

export default function HousingLoans() {
    const data = useStore((s: StoreState) => s.data);
    const { housingLoans } = data;

    return (
        <>
            <div className='w-full mt-8'>
                <h1 className='text-4xl md:text-5xl font-bold mb-4 text-brandBlue'>
                    Nedbetalingsplan for boliglån
                </h1>
                <TypographyP>
                    Her finner du detaljerte beregninger av alle dine boliglån,
                    inkludert nedbetaling, renter og restgjeld for hver termin.
                </TypographyP>
            </div>

            <section className='mt-4'>
                <TypographyH2>Dine boliglån</TypographyH2>

                {housingLoans.length === 0 && (
                    <TypographyP>
                        Du har ikke lagt til noen boliglån enda.
                    </TypographyP>
                )}

                {housingLoans.length > 0 &&
                    housingLoans.map((loan, index) => {
                        const schedule = generateAmortizationSchedule(loan);

                        return (
                            <div key={index} className='my-8'>
                                <TypographyH3>
                                    Nedbetalingsoversikt, {loan.description}
                                </TypographyH3>

                                <table className='w-full table-auto text-sm border-collapse'>
                                    <thead className='bg-gray-100'>
                                        <tr>
                                            <th className='p-2 text-left'>
                                                Termin
                                            </th>
                                            <th className='p-2 text-left'>
                                                Terminbeløp
                                            </th>
                                            <th className='p-2 text-left'>
                                                Renter
                                            </th>
                                            <th className='p-2 text-left'>
                                                Avdrag
                                            </th>
                                            <th className='p-2 text-left'>
                                                Gebyr
                                            </th>
                                            <th className='p-2 text-left'>
                                                Restgjeld
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {/* First 12 months */}
                                        {schedule.first12Months.map((row) => (
                                            <tr
                                                key={row.term}
                                                className='border-b'
                                            >
                                                <td className='p-2'>
                                                    Måned {row.term}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.payment
                                                    )}{' '}
                                                    kr
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.interest
                                                    )}{' '}
                                                    kr
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.principal
                                                    )}{' '}
                                                    kr
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(row.fee)}{' '}
                                                    kr
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.balance
                                                    )}{' '}
                                                    kr
                                                </td>
                                            </tr>
                                        ))}

                                        {/* Yearly summaries */}
                                        {schedule.yearGroups.map((year) => (
                                            <tr
                                                key={'year-' + year.year}
                                                className='border-b bg-gray-50 font-semibold'
                                            >
                                                <td className='p-2'>
                                                    År {year.year}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        year.totalPaid
                                                    )}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        year.totalInterest
                                                    )}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        year.totalPrincipal
                                                    )}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        year.totalFees
                                                    )}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        year.endBalance
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>

                                    <tfoot className='bg-gray-50 font-semibold'>
                                        <tr>
                                            <td className='p-2'>Totalt</td>
                                            <td className='p-2'>
                                                {formatNumberToNOK(
                                                    schedule.totals.totalPaid
                                                )}
                                            </td>
                                            <td className='p-2'>
                                                {formatNumberToNOK(
                                                    schedule.totals
                                                        .totalInterest
                                                )}
                                            </td>
                                            <td className='p-2'>
                                                {formatNumberToNOK(
                                                    schedule.totals
                                                        .totalPrincipal
                                                )}
                                            </td>
                                            <td className='p-2'>
                                                {formatNumberToNOK(
                                                    schedule.totals.totalFees
                                                )}
                                            </td>
                                            <td className='p-2'>–</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        );
                    })}
            </section>
        </>
    );
}
