'use client';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyH3 } from '@/components/typography/typographyH3';
import { TypographyP } from '@/components/typography/typographyP';
import { computeLoanAmortization } from '@/lib/amortization';
import useStore, { StoreState } from '@/lib/store';
import { formatNumberToNOK } from '@/lib/utils';

export default function Loans() {
    const data = useStore((s: StoreState) => s.data);

    // Get active house and its housing loan
    const activeHouse = (data.houses || []).find(
        (h) => h.id === data.activeHouseId
    );
    const housingLoan = activeHouse?.housingLoan;
    const loans = data.loans || [];

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
                <TypographyH2>
                    Boliglån {activeHouse ? `(${activeHouse.name})` : ''}
                </TypographyH2>

                {!housingLoan && (
                    <TypographyP>
                        Du har ikke valgt noen bolig enda. Gå til boligsiden for
                        å legge til en bolig og se nedbetalingsplanen her.
                    </TypographyP>
                )}

                {housingLoan &&
                    housingLoan.loanAmount > 0 &&
                    (() => {
                        const schedule = computeLoanAmortization(housingLoan);

                        return (
                            <div className='overflow-auto my-4'>
                                <TypographyH3>
                                    {housingLoan.description}
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

                                        <tr>
                                            <td
                                                className='p-2 font-semibold'
                                                colSpan={6}
                                            >
                                                ...
                                            </td>
                                        </tr>

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
                    })()}
            </section>

            <section className='mt-4'>
                <TypographyH2>Andre Lån</TypographyH2>

                {loans.length === 0 && (
                    <TypographyP>
                        Du har ikke lagt til noen andre lån enda. Legg til et
                        lån på data-siden for å se nedbetalingsplanen her.
                    </TypographyP>
                )}

                {loans.length > 0 &&
                    loans.map((loan, index) => {
                        const schedule = computeLoanAmortization(loan);

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
                                        <tr>
                                            <td
                                                className='p-2 font-semibold'
                                                colSpan={6}
                                            >
                                                ...
                                            </td>
                                        </tr>

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
