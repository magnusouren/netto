'use client';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyH3 } from '@/components/typography/typographyH3';
import { TypographyP } from '@/components/typography/typographyP';
import useStore, { StoreState } from '@/lib/store';
import { formatNumberToNOK } from '@/lib/utils';

// --------------------------------------
// --- Amortization (Annuitetslån) ------
// --------------------------------------

function generateAmortizationSchedule(loan: {
    loanAmount: number;
    interestRate: number;
    termYears: number;
    termsPerYear: number;
    monthlyFee?: number;
    startDate: string;
}) {
    const {
        loanAmount,
        interestRate,
        termYears,
        termsPerYear,
        monthlyFee = 0,
        startDate,
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

    // Parse start date
    let currentDate = new Date(startDate);
    const addMonths = (d: Date, n: number) =>
        new Date(d.getFullYear(), d.getMonth() + n, d.getDate());

    const termsLeftThisYear =
        termsPerYear - (currentDate.getMonth() % termsPerYear);
    const initialTerms = Math.min(termsLeftThisYear, numberOfTerms);

    let yearInterest = 0;
    let yearPrincipal = 0;
    let yearFees = 0;
    let yearPaid = 0;

    for (let term = 1; term <= numberOfTerms; term++) {
        const interest = balance * ratePerTerm;
        const principal = Math.min(termPayment - interest, balance); // prevent overpayment
        balance -= principal;

        const payment = principal + interest + monthlyFee;

        // Format date
        const formattedDate = currentDate.toLocaleString('no-NO', {
            year: 'numeric',
            month: 'short',
        });

        // Save first 12 months
        if (term <= initialTerms) {
            first12Months.push({
                term,
                date: formattedDate,
                payment,
                interest,
                principal,
                fee: monthlyFee,
                balance,
            });
        }

        // Year accumulation
        const entryYear = currentDate.getFullYear();
        yearInterest += interest;
        yearPrincipal += principal;
        yearFees += monthlyFee;
        yearPaid += payment;

        // Check next year
        const nextDate = addMonths(currentDate, 1);
        const nextYear = nextDate.getFullYear();

        if (nextYear !== entryYear || term === numberOfTerms) {
            yearGroups.push({
                year: entryYear,
                totalInterest: yearInterest,
                totalPrincipal: yearPrincipal,
                totalFees: yearFees,
                totalPaid: yearPaid,
                endBalance: balance,
            });

            yearInterest = 0;
            yearPrincipal = 0;
            yearFees = 0;
            yearPaid = 0;
        }

        // Advance date
        currentDate = nextDate;
    }

    // Compute totals across entire loan
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

interface HousingLoanDataRowMonthly {
    term: number;
    date: string;
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

export default function Loans() {
    const data = useStore((s: StoreState) => s.data);
    const { housingLoans, loans } = data;

    return (
        <>
            <div className='container my-8 min-h-24'>
                <TypographyH1>Nedbetalingsplaner</TypographyH1>
                <TypographyP>
                    Her finner du detaljerte nedbetalingsplaner for alle dine
                    boliglån og andre lån. Tabellen viser hvordan hver betaling
                    fordeles mellom renter, avdrag og eventuelle gebyrer, samt
                    hvordan restgjelden reduseres over tid.
                </TypographyP>
            </div>

            <section className='container'>
                <TypographyH2>Dine boliglån</TypographyH2>

                {housingLoans.length === 0 && (
                    <TypographyP>
                        Du har ikke lagt til noen boliglån enda. Legg til et
                        boliglån på forsiden for å se nedbetalingsplanen her.
                    </TypographyP>
                )}

                {housingLoans.length > 0 &&
                    housingLoans.map((loan, index) => {
                        const schedule = generateAmortizationSchedule(loan);

                        return (
                            <div key={index} className='overflow-auto my-4'>
                                <TypographyH3>{loan.description}</TypographyH3>

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
                                                    {row.date}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.payment
                                                    )}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.interest
                                                    )}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.principal
                                                    )}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(row.fee)}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.balance
                                                    )}
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
                                                    {year.year}
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

            <section className='mt-4'>
                <TypographyH2>Andre Lån</TypographyH2>

                {loans.length === 0 && (
                    <TypographyP>
                        Du har ikke lagt til noen boliglån enda. Legg til et
                        boliglån på forsiden for å se nedbetalingsplanen her.
                    </TypographyP>
                )}

                {loans.length > 0 &&
                    loans.map((loan, index) => {
                        const schedule = generateAmortizationSchedule(loan);

                        return (
                            <div key={index} className='my-8 overflow-auto'>
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
                                                    {row.date}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.payment
                                                    )}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.interest
                                                    )}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.principal
                                                    )}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(row.fee)}
                                                </td>
                                                <td className='p-2'>
                                                    {formatNumberToNOK(
                                                        row.balance
                                                    )}
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
                                                    {year.year}
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
