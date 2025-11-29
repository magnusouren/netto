import React from 'react';
import { Button } from '@/components/ui/button';
import type { EconomyData, Loan } from '@/types';

interface TaxesProps {
    data: EconomyData;
    setData: React.Dispatch<React.SetStateAction<EconomyData>>;
}

export default function Taxes({ data }: TaxesProps) {
    const totalIncome = data.incomes.reduce((s, i) => s + i.amount, 0);

    // minstefradrag: 46% av inntekt, maks 92 000
    const minstefradrag = Math.min(totalIncome * 0.46, 92000);

    // collect all loans (student + other + housing)
    const loans: Loan[] = [...data.loans, ...data.housingLoans];

    const loanRows = loans.map((loan) => {
        // enkel beregning av betalte renter per år (approx): lånebeløp * rente%
        const paidInterest =
            ((loan.loanAmount || 0) * (loan.interestRate || 0)) / 100;
        const taxDeduction = paidInterest * 0.22; // 22% rentefradrag
        return {
            description: loan.description,
            loanAmount: loan.loanAmount,
            interestRate: loan.interestRate,
            paidInterest,
            taxDeduction,
        };
    });

    const totalPaidInterest = loanRows.reduce((s, r) => s + r.paidInterest, 0);
    const totalInterestDeduction = loanRows.reduce(
        (s, r) => s + r.taxDeduction,
        0
    );

    // Beregn fradrag: minstefradrag + rentefradrag
    const totalDeductions = minstefradrag + totalInterestDeduction;

    // Implementerer LET-formelen fra Excel (oversatt til JS)
    const inntekt = totalIncome;
    const fradrag = totalDeductions;

    const alminnelig = Math.max(inntekt - fradrag, 0);

    const skatt_alminnelig = alminnelig * 0.1772; // 17.72%
    const trygdeavgift = inntekt * 0.077; // 7.7%

    const trinn1 = Math.max(Math.min(inntekt, 306050) - 217400, 0) * 0.017;
    const trinn2 = Math.max(Math.min(inntekt, 697150) - 306050, 0) * 0.04;
    const trinn3 = Math.max(Math.min(inntekt, 942400) - 697150, 0) * 0.137;
    const trinn4 = Math.max(Math.min(inntekt, 1410750) - 942400, 0) * 0.167;
    const trinn5 = Math.max(inntekt - 1410750, 0) * 0.177;

    const trinnskatt = trinn1 + trinn2 + trinn3 + trinn4 + trinn5;

    const totalTaxes = skatt_alminnelig + trygdeavgift + trinnskatt;

    const taxPaid = skatt_alminnelig + trygdeavgift + trinnskatt;

    const nettoInntektForelopig = totalIncome - taxPaid;

    return (
        <section className='w-full my-8'>
            <div className='flex items-center justify-between mb-2'>
                <h2 className='text-2xl font-semibold'>Skatteoversikt</h2>
            </div>

            <div className='overflow-auto rounded-md border'>
                <table className='w-full table-fixed'>
                    <thead>
                        <tr className='bg-muted text-sm'>
                            <th className='p-2 text-left'>Beskrivelse</th>
                            <th className='p-2 text-right'>Beløp</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Inntekter
                            </td>
                        </tr>
                        {/* All incomes*/}
                        {data.incomes.map((income, index) => (
                            <tr
                                key={index}
                                className='odd:bg-background even:bg-muted/5'
                            >
                                <td className='p-2'>
                                    {income.source || `Inntekt ${index + 1}`}
                                </td>
                                <td className='p-2 text-right'>
                                    {income.amount.toLocaleString()} kr
                                </td>
                            </tr>
                        ))}

                        {/* Brutto inntekt row */}
                        <tr className='border-t italic'>
                            <td className='p-2'>Total brutto inntekt</td>
                            <td className='p-2 text-right'>
                                {totalIncome.toLocaleString()} kr
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Renter
                            </td>
                        </tr>
                        {/* Loan rows */}
                        {loanRows.map((r, i) => (
                            <tr
                                key={i}
                                className='odd:bg-background even:bg-muted/5'
                            >
                                <td className='p-2'>
                                    Renter {r.description || `Lån ${i + 1}`}
                                </td>
                                <td className='p-2 text-right'>
                                    {Math.round(
                                        r.paidInterest
                                    ).toLocaleString()}
                                </td>
                            </tr>
                        ))}

                        {/* Totals row for interest */}
                        <tr>
                            <td className='p-2'>Totalt renter</td>
                            <td className='p-2 text-right'>
                                {Math.round(totalPaidInterest).toLocaleString()}
                            </td>
                        </tr>

                        {/* Total rentefradrag row */}
                        <tr className='border-t italic'>
                            <td className='p-2'>Totalt rentefradrag</td>
                            <td className='p-2 text-right'>
                                {Math.round(
                                    totalInterestDeduction
                                ).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Fradrag
                            </td>
                        </tr>

                        {/* Minstefradrag row */}
                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Minstefradrag</td>
                            <td className='p-2 text-right'>
                                {Math.round(minstefradrag).toLocaleString()} kr
                            </td>
                        </tr>

                        {/* Rentefradrag row */}
                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Rentefradrag</td>
                            <td className='p-2 text-right'>
                                {Math.round(
                                    totalInterestDeduction
                                ).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>

                        <tr className='border-t italic'>
                            <td className='p-2'>Totale fradrag</td>
                            <td className='p-2 text-right'>
                                {Math.round(totalDeductions).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Skatteberegning
                            </td>
                        </tr>

                        {/* Skattekomponenter */}
                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Alminnelig skatt (17.72%)</td>
                            <td className='p-2 text-right'>
                                {Math.round(skatt_alminnelig).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>
                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Trygdeavgift (7.7%)</td>
                            <td className='p-2 text-right'>
                                {Math.round(trygdeavgift).toLocaleString()} kr
                            </td>
                        </tr>
                        <tr className='odd:bg-background even:bg-muted/5'>
                            <td className='p-2'>Trinnskatt</td>
                            <td className='p-2 text-right'>
                                {Math.round(trinnskatt).toLocaleString()} kr
                            </td>
                        </tr>
                        <tr className='border-t italic'>
                            <td className='p-2'>Totale skatter</td>
                            <td className='p-2 text-right'>
                                {Math.round(totalTaxes).toLocaleString()} kr
                            </td>
                        </tr>

                        <tr className='mt-4'>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Oppsummering
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Skatt å betale</td>
                            <td className='p-2 text-right'>
                                {Math.round(taxPaid).toLocaleString()} kr
                            </td>
                        </tr>

                        {/* Netto inntekt row */}
                        <tr>
                            <td className='p-2'>Netto inntekt</td>
                            <td className='p-2 text-right'>
                                {Math.round(
                                    nettoInntektForelopig
                                ).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className='mt-2'>
                <Button disabled variant='outline'>
                    + Legg til fradrag (kommer snart)
                </Button>
            </div>
        </section>
    );
}
