'use client';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loanPaymentPlan } from '@/lib/loanPaymentPlan';
import useStore, { StoreState } from '@/lib/store';
import { formatNumberToNOK } from '@/lib/utils';
import { useState } from 'react';

export default function Plan() {
    const data = useStore((s: StoreState) => s.data);

    // Get active house
    const activeHouse = (data.houses || []).find(
        (h) => h.id === data.activeHouseId
    );

    const [priceIncrease, setPriceIncrease] = useState(2);
    const [yearsToShow, setYearsToShow] = useState(10);
    const [savings, setSavings] = useState(0);

    return (
        <>
            <div className='container my-8 min-h-24'>
                <TypographyH1>Egenkapitalutvikling</TypographyH1>
                <TypographyP>
                    Her vil du kunne se hvordan prisstigning på boligen din
                    samtidig med nedbetaling av lån påvirker egenkapitalen din
                    over tid.
                </TypographyP>
            </div>

            <section className='container'>
                <div>
                    <TypographyH2>Variabler</TypographyH2>
                    <TypographyP>
                        Juster variablene under for å se hvordan de påvirker
                        egenkapitalen din over tid.
                    </TypographyP>
                    <label className='block'>
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                            <div>
                                <Label htmlFor='price-increase'>
                                    Årlig prisstigning på bolig (%)
                                </Label>
                                <Input
                                    id='price-increase'
                                    type='number'
                                    value={priceIncrease}
                                    onChange={(e) =>
                                        setPriceIncrease(Number(e.target.value))
                                    }
                                    className='mt-2'
                                />
                            </div>
                            <div>
                                <Label htmlFor='years-to-show'>
                                    Antall år å vise i planen
                                </Label>

                                <Input
                                    id='years-to-show'
                                    type='number'
                                    value={yearsToShow}
                                    onChange={(e) =>
                                        setYearsToShow(Number(e.target.value))
                                    }
                                    className='mt-2'
                                />
                            </div>
                            <div>
                                <Label htmlFor='savings'>
                                    Oppsparte midler (kr)
                                </Label>

                                <Input
                                    id='savings'
                                    type='number'
                                    value={savings}
                                    onChange={(e) =>
                                        setSavings(Number(e.target.value))
                                    }
                                    className='mt-2'
                                />
                            </div>
                        </div>
                    </label>
                </div>
                {!activeHouse && (
                    <TypographyP>
                        Du har ingen bolig valgt. Gå til Boliger for å legge til
                        og velge en bolig.
                    </TypographyP>
                )}
                {activeHouse && activeHouse.housingLoan.loanAmount > 0 && (
                    <div className='mt-8 overflow-auto '>
                        <TypographyH2>{activeHouse.name}</TypographyH2>

                        <table className='w-full mt-4 table-auto text-sm border-collapse rounded-md'>
                            <thead>
                                <tr className='bg-muted'>
                                    <th className='p-2 text-left'>Måned</th>
                                    <th className='p-2 text-right'>
                                        Restgjeld
                                    </th>
                                    <th className='p-2 text-right'>
                                        Boligverdi
                                    </th>
                                    <th className='p-2 text-right'>
                                        EK ved salg
                                    </th>
                                    <th className='p-2 text-right'>
                                        Diff. siden kjøp
                                    </th>
                                    <th className='p-2 text-right'>
                                        EK + Oppsparte midler
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loanPaymentPlan(
                                    {
                                        ...activeHouse.housingLoan,
                                        capital:
                                            activeHouse.purchase.equityUsed,
                                    },
                                    priceIncrease,
                                    yearsToShow
                                ).map((entry, idx) => (
                                    <tr
                                        key={idx}
                                        className={
                                            idx % 2 === 0
                                                ? 'bg-background'
                                                : 'bg-muted'
                                        }
                                    >
                                        <td className='p-2'>
                                            {entry.monthYear}
                                        </td>
                                        <td className='p-2 text-right'>
                                            {formatNumberToNOK(
                                                entry.remainingDebt
                                            )}
                                        </td>
                                        <td className='p-2 text-right'>
                                            {formatNumberToNOK(
                                                entry.housingValue
                                            )}
                                        </td>

                                        <td className='p-2 text-right'>
                                            {formatNumberToNOK(entry.equity)}
                                        </td>

                                        <td className='p-2 text-right'>
                                            {formatNumberToNOK(
                                                activeHouse.housingLoan
                                                    .loanAmount -
                                                    entry.remainingDebt +
                                                    entry.housingValue -
                                                    (activeHouse.housingLoan
                                                        .loanAmount +
                                                        activeHouse.purchase
                                                            .equityUsed)
                                            )}
                                        </td>
                                        <td className='p-2 text-right'>
                                            {formatNumberToNOK(
                                                entry.equity + savings
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </>
    );
}
