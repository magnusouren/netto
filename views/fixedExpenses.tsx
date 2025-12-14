import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useStore, { StoreState } from '@/lib/store';
import type { FixedExpense } from '@/types';
import { Trash } from 'lucide-react';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';

export default function FixedExpenses() {
    const personalFixedExpenses = useStore(
        (s: StoreState) => s.data.personalFixedExpenses
    );
    const setData = useStore((s: StoreState) => s.setData);
    const hasHydrated = useStore((s) => s._hasHydrated);
    const addFixedExpense = useStore((s: StoreState) => s.addFixedExpense);
    const updateFixedExpense = useStore(
        (s: StoreState) => s.updateFixedExpense
    );
    const deleteFixedExpense = useStore(
        (s: StoreState) => s.deleteFixedExpense
    );

    const personalDefaults = ['Trening', 'Abonnementer', 'Forsikringer'];

    useEffect(() => {
        if (!hasHydrated) return;

        if (personalFixedExpenses.length === 0) {
            const defaults: FixedExpense[] = personalDefaults.map<FixedExpense>(
                (d) => ({
                    description: d,
                    amount: 0,
                    category: 'personal',
                })
            );
            setData((prev) => ({
                ...prev,
                personalFixedExpenses: defaults,
            }));
        }
    });

    function addExpense() {
        addFixedExpense({ description: '', amount: 0, category: 'personal' });
    }

    function updateExpense(index: number, patch: Partial<FixedExpense>) {
        updateFixedExpense(index, patch);
    }

    function deleteExpense(index: number) {
        deleteFixedExpense(index);
    }

    return (
        <section className='w-full my-8'>
            <TypographyH2>Faste personlige utgifter</TypographyH2>
            <TypographyP>
                Legg til dine faste personlige utgifter her. Boligrelaterte
                kostnader administreres på boligsiden.
            </TypographyP>

            <div>
                <div className='overflow-auto rounded-md border'>
                    <table className='w-full table-fixed text-sm'>
                        <thead>
                            <tr className='bg-muted'>
                                <th className='p-2 text-left w-3/4'>
                                    Beskrivelse
                                </th>
                                <th className='p-2 text-left w-1/4'>Beløp</th>
                                <th className='p-2 w-12'> </th>
                            </tr>
                        </thead>
                        <tbody>
                            {personalFixedExpenses.map((item, index) => (
                                <tr key={index}>
                                    <td className='p-2 pb-0'>
                                        <Input
                                            id={`fixed-desc-${index}`}
                                            value={item.description}
                                            onChange={(e) =>
                                                updateExpense(index, {
                                                    description: e.target.value,
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='p-2 pl-0 pb-0 pr-0'>
                                        <Input
                                            id={`fixed-amount-${index}`}
                                            type='number'
                                            value={item.amount}
                                            onChange={(e) =>
                                                updateExpense(index, {
                                                    amount: Number(
                                                        e.target.value || 0
                                                    ),
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='p-2 pb-0 pl-0 pr-0 text-center'>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            className='text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
                                            onClick={() => deleteExpense(index)}
                                        >
                                            <Trash />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                            <tr>
                                <td className='p-2 pb-0'> </td>
                                <td className='p-2 pb-0'> </td>
                                <td className='p-2 pb-0'> </td>
                            </tr>
                            <tr className='border-t font-semibold'>
                                <td className='p-2 pl-4'>Totalt</td>
                                <td className='p-2 pl-4' colSpan={2}>
                                    {personalFixedExpenses
                                        .reduce(
                                            (total, item) =>
                                                total + item.amount,
                                            0
                                        )
                                        .toLocaleString('nb-NO')}{' '}
                                    kr / mnd
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <Button
                    variant='outline'
                    className='w-full mt-2'
                    onClick={() => addExpense()}
                >
                    + Legg til utgift
                </Button>
            </div>
        </section>
    );
}
