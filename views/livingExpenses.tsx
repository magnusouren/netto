import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EconomyData, LivingCost } from '@/types';
import { Trash } from 'lucide-react';

interface LivingExpensesProps {
    data: EconomyData;
    setData: React.Dispatch<React.SetStateAction<EconomyData>>;
}

// TODO - use https://kalkulator.referansebudsjett.no/php/resultat_as_json.php?select_year=2025&inntekt=0&antall_biler=0&antall_elbiler=0&kjonn0=m&alder0=30&barnehage0=0&sfo0=0&sfogratis0=0&gravid0=0&student0=0&pensjonist0=0&lang=no

export default function LivingExpenses({ data, setData }: LivingExpensesProps) {
    // sensible defaults for living costs (one category only)
    const defaults = [
        'Dagligvarer',
        'Transport',
        'Mobilabonnement',
        'Underholdning',
    ];

    useEffect(() => {
        if (!data.livingCosts || data.livingCosts.length === 0) {
            const seeded: LivingCost[] = defaults.map((d) => ({
                description: d,
                amount: 0,
            }));
            setData((prev) => ({ ...prev, livingCosts: seeded }));
        }
        // run only on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function addLivingCost() {
        setData((prev) => ({
            ...prev,
            livingCosts: [...prev.livingCosts, { description: '', amount: 0 }],
        }));
    }

    function updateLivingCost(index: number, patch: Partial<LivingCost>) {
        setData((prev) => {
            const list = [...prev.livingCosts];
            list[index] = { ...list[index], ...patch };
            return { ...prev, livingCosts: list };
        });
    }

    function deleteLivingCost(index: number) {
        setData((prev) => {
            const list = prev.livingCosts.filter((_, i) => i !== index);
            return { ...prev, livingCosts: list };
        });
    }

    const totalLivingCosts = data.livingCosts.reduce(
        (total, item) => total + item.amount,
        0
    );

    return (
        <section className='w-full my-8'>
            <div className='flex items-center justify-between mb-2'>
                <h2 className='text-xl font-semibold'>
                    Levekostnader – {totalLivingCosts.toLocaleString()} kr / mnd
                </h2>
            </div>
            <p className='mt-2 mb-4 text-muted-foreground'>
                Legg inn løpende levekostnader her. Første kolonne er en
                beskrivelse (statisk tekst) og beløp kan endres direkte. TODO -
                hent forslag fra referansebudsjett.no basert på inntekt og
                husholdningstype
            </p>

            <div className='overflow-auto rounded-md border'>
                <table className='w-full table-fixed'>
                    <thead>
                        <tr className='bg-muted text-sm'>
                            <th className='p-2 text-left w-3/4'>Beskrivelse</th>
                            <th className='p-2 text-left w-1/4'>Beløp (kr)</th>
                            <th className='w-12'> </th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.livingCosts.map((item, index) => (
                            <tr
                                key={index}
                                className='odd:bg-background even:bg-muted/5'
                            >
                                <td className='p-2'>
                                    <Input
                                        id={`living-description-${index}`}
                                        type='text'
                                        value={item.description}
                                        placeholder='Dagligvarer'
                                        onChange={(e) =>
                                            updateLivingCost(index, {
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </td>
                                <td className='p-2'>
                                    <Input
                                        id={`living-amount-${index}`}
                                        type='number'
                                        value={item.amount}
                                        onChange={(e) =>
                                            updateLivingCost(index, {
                                                amount: Number(
                                                    e.target.value || 0
                                                ),
                                            })
                                        }
                                    />
                                </td>
                                <td className='p-2 text-center'>
                                    <Button
                                        variant='outline'
                                        className=' text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
                                        size='icon-sm'
                                        onClick={() => deleteLivingCost(index)}
                                    >
                                        <Trash />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        <tr className='border-t font-semibold text-sm'>
                            <td className='p-2 pl-4 '>Totalt</td>
                            <td className='p-2 pl-4 '>
                                {totalLivingCosts.toLocaleString()} kr / mnd
                            </td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className='mt-2'>
                <Button variant='outline' onClick={addLivingCost}>
                    + Legg til levekostnad
                </Button>
            </div>
        </section>
    );
}
