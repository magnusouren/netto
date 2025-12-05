'use client';

import useStore, { StoreState } from '@/lib/store';
import { TypographyH2 } from '@/components/typography/typographyH2';

import { calculateAnnualTaxes } from '@/lib/calcTaxes';
import { formatNumberToNOK } from '@/lib/utils';

export default function Taxes() {
    const data = useStore((s: StoreState) => s.data);
    const tax = calculateAnnualTaxes(data);

    return (
        <>
            <TypographyH2>Skatteberegning</TypographyH2>

            <div className='overflow-auto rounded-md border mt-4'>
                <table className='w-full table-fixed text-sm'>
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

                        {data.incomes.map((inc, i) => (
                            <tr key={i}>
                                <td className='p-2'>{inc.source}</td>
                                <td className='p-2 text-right'>
                                    {formatNumberToNOK(inc.amount)}
                                </td>
                            </tr>
                        ))}

                        <tr className='border-t italic'>
                            <td className='p-2'>Total brutto inntekt</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.totalIncome)}
                            </td>
                        </tr>

                        {/* Renter */}
                        <tr>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Renter
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Renter</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.totalPaidInterest)}
                            </td>
                        </tr>

                        <tr className='border-t italic'>
                            <td className='p-2'>Totalt renter</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.totalPaidInterest)}
                            </td>
                        </tr>

                        {/* Fradrag */}
                        <tr>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Fradrag
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Minstefradrag</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.minstefradrag)}
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Rentefradrag</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.totalInterestDeduction)}
                            </td>
                        </tr>

                        <tr className='border-t italic'>
                            <td className='p-2'>Totale fradrag</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.totalDeductions)}
                            </td>
                        </tr>

                        {/* Skatt */}
                        <tr>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Skatt
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>
                                Skattegrunnlag (alminnelig inntekt)
                            </td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.alminnelig)}
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Alminnelig skatt (17.72%)</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.skatt_alminnelig)}
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Trygdeavgift (7.7%)</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.trygdeavgift)}
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Trinnskatt</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.trinnskatt)}
                            </td>
                        </tr>

                        <tr className='p-2'>
                            <td className='p-2'>Effektiv skattesats</td>
                            <td className='p-2 text-right'>
                                {tax.effectiveTaxRate.toFixed(1)} %
                            </td>
                        </tr>

                        <tr className='border-t italic'>
                            <td className='p-2'>Totale skatter</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.totalTaxes)}
                            </td>
                        </tr>

                        {/* Netto */}
                        <tr>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Netto
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Netto årsinntekt</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.netAnnualIncome)}
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Netto månedsinntekt</td>
                            <td className='p-2 text-right'>
                                {formatNumberToNOK(tax.netMonthlyIncome)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}
