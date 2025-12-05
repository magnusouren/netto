import useStore, { StoreState } from '@/lib/store';
import { TypographyH2 } from '@/components/typography/typographyH2';

import { calculateAnnualTaxes } from '@/lib/calcTaxes';

export default function Taxes() {
    const data = useStore((s: StoreState) => s.data);

    const tax = calculateAnnualTaxes(data);

    return (
        <section className='w-full my-8'>
            <TypographyH2>Skatteberegning</TypographyH2>

            <div className='overflow-auto rounded-md border'>
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
                                    {inc.amount.toLocaleString()} kr
                                </td>
                            </tr>
                        ))}

                        <tr className='border-t italic'>
                            <td className='p-2'>Total brutto inntekt</td>
                            <td className='p-2 text-right'>
                                {tax.totalIncome.toLocaleString()} kr
                            </td>
                        </tr>

                        {/* Renter */}
                        <tr>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Renter
                            </td>
                        </tr>

                        {tax.loanRows.map((row, i) => (
                            <tr key={i}>
                                <td className='p-2'>
                                    Renter {row.description}
                                </td>
                                <td className='p-2 text-right'>
                                    {Math.round(
                                        row.paidInterest
                                    ).toLocaleString()}{' '}
                                    kr
                                </td>
                            </tr>
                        ))}

                        <tr className='border-t italic'>
                            <td className='p-2'>Totalt renter</td>
                            <td className='p-2 text-right'>
                                {Math.round(
                                    tax.totalPaidInterest
                                ).toLocaleString()}{' '}
                                kr
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
                                {Math.round(tax.minstefradrag).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Rentefradrag</td>
                            <td className='p-2 text-right'>
                                {Math.round(
                                    tax.totalInterestDeduction
                                ).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>

                        <tr className='border-t italic'>
                            <td className='p-2'>Totale fradrag</td>
                            <td className='p-2 text-right'>
                                {Math.round(
                                    tax.totalDeductions
                                ).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>

                        {/* Skatt */}
                        <tr>
                            <td className='p-2 font-semibold' colSpan={2}>
                                Skatt
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Alminnelig inntekt</td>
                            <td className='p-2 text-right'>
                                {Math.round(tax.alminnelig).toLocaleString()} kr
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Alminnelig skatt (17.72%)</td>
                            <td className='p-2 text-right'>
                                {Math.round(
                                    tax.skatt_alminnelig
                                ).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Trygdeavgift (7.7%)</td>
                            <td className='p-2 text-right'>
                                {Math.round(tax.trygdeavgift).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Trinnskatt</td>
                            <td className='p-2 text-right'>
                                {Math.round(tax.trinnskatt).toLocaleString()} kr
                            </td>
                        </tr>

                        <tr className='border-t italic'>
                            <td className='p-2'>Totale skatter</td>
                            <td className='p-2 text-right'>
                                {Math.round(tax.totalTaxes).toLocaleString()} kr
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
                                {Math.round(
                                    tax.netAnnualIncome
                                ).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>

                        <tr>
                            <td className='p-2'>Netto månedsinntekt</td>
                            <td className='p-2 text-right'>
                                {Math.round(
                                    tax.netMonthlyIncome
                                ).toLocaleString()}{' '}
                                kr
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </section>
    );
}
