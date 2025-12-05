'use client';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generatePaymentPlan } from '@/lib/monthlyPaymentPlan';
import useStore, { StoreState } from '@/lib/store';
import { formatNumberToNOK } from '@/lib/utils';
import { useState } from 'react';

export default function PaymentPlan() {
    const data = useStore((s: StoreState) => s.data);

    const [sallaryAnnualGrowth, setSallaryAnnualGrowth] = useState(2);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(1); // always use 1st of month
        return d.toISOString().slice(0, 10); // YYYY-MM-DD
    });

    return (
        <>
            <div className='container my-8 min-h-24'>
                <TypographyH1>Månedlig økonomi</TypographyH1>
                <TypographyP>
                    Her vil du kunne se hvordan dine månedlige utgifter egentlig
                    ser ut med tanke på lån, renter og andre kostnader.
                </TypographyP>
            </div>

            <section className='container'>
                <div>
                    <TypographyH2>Variabler</TypographyH2>
                    <TypographyP>
                        Juster variablene under for å se hvordan de påvirker din
                        økonomi.
                    </TypographyP>
                    <div className='my-4'>
                        <Label htmlFor='sallary-annual-growth'>
                            Årlig lønnsvekst (%)
                        </Label>
                        <Input
                            id='sallary-annual-growth'
                            type='number'
                            value={sallaryAnnualGrowth}
                            className='mt-2'
                            onChange={(e) =>
                                setSallaryAnnualGrowth(Number(e.target.value))
                            }
                        />
                        <div className='my-4'>
                            <Label htmlFor='start-date'>
                                Startdato for oversikten
                            </Label>
                            <Input
                                id='start-date'
                                type='date'
                                className='mt-2'
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className='my-8'>
                    <TypographyH2>Betalingsplan</TypographyH2>
                    <TypographyP>
                        Nedenfor er en oversikt over dine månedlige inntekter og
                        utgifter, inkludert nedbetaling av lån og
                        rentekostnader.
                    </TypographyP>
                    <table className='w-full table-auto text-sm'>
                        <thead>
                            <tr className='bg-muted'>
                                <th className='p-2 text-left'>Måned</th>
                                <th className='p-2 text-right'>Inntekter</th>
                                <th className='p-2 text-right'>Utgifter</th>
                                <th className='p-2 text-right'>Avdrag</th>
                                <th className='p-2 text-right'>Balanse</th>
                                <th className='p-2 text-right'>
                                    Ekskl. Avdrag
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {generatePaymentPlan(
                                data,
                                sallaryAnnualGrowth,
                                startDate
                            ).map((row, idx) => (
                                <tr key={idx} className='border-b'>
                                    <td className='p-2'>{row.month}</td>
                                    <td className='p-2 text-right'>
                                        {formatNumberToNOK(row.income)}
                                    </td>
                                    <td className='p-2 text-right'>
                                        {formatNumberToNOK(row.expenses)}
                                    </td>
                                    <td className='p-2 text-right'>
                                        {formatNumberToNOK(row.totalPrincipal)}
                                    </td>
                                    <td className='p-2 text-right'>
                                        {formatNumberToNOK(row.balance)}
                                    </td>
                                    <td className='p-2 text-right'>
                                        {formatNumberToNOK(
                                            row.balancePlusPrincipal
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
