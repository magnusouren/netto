import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import useStore, { StoreState } from '@/lib/store';
import type { FixedExpense } from '@/types';
import { Trash } from 'lucide-react';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';

export default function FixedExpenses() {
    const fixedExpenses = useStore((s: StoreState) => s.data.fixedExpenses);
    const setData = useStore((s: StoreState) => s.setData);
    const hasHydrated = useStore((s) => s._hasHydrated);
    const addFixedExpense = useStore((s: StoreState) => s.addFixedExpense);
    const updateFixedExpense = useStore(
        (s: StoreState) => s.updateFixedExpense
    );
    const deleteFixedExpense = useStore(
        (s: StoreState) => s.deleteFixedExpense
    );
    // default items to add when none exist
    const housingDefaults = [
        'Strøm',
        'Felleskostnader',
        'Kommunale avgifter',
        'Internett',
        'Forsikring',
        'TV',
    ];

    const personalDefaults = ['Trening', 'Abonnementer'];

    useEffect(() => {
        if (!hasHydrated) return; // ⛔ wait for localStorage to be ready

        if (fixedExpenses.length === 0) {
            const defaults: FixedExpense[] = [
                ...housingDefaults.map<FixedExpense>((d) => ({
                    description: d,
                    amount: 0,
                    category: 'housing',
                })),
                ...personalDefaults.map<FixedExpense>((d) => ({
                    description: d,
                    amount: 0,
                    category: 'personal',
                })),
            ];
            setData((prev) => ({
                ...prev,
                fixedExpenses: defaults,
            }));
        }
    });

    function addExpense(category: FixedExpense['category']) {
        addFixedExpense({ description: '', amount: 0, category });
    }

    function updateExpense(index: number, patch: Partial<FixedExpense>) {
        updateFixedExpense(index, patch);
    }

    function deleteExpense(index: number) {
        deleteFixedExpense(index);
    }

    // group items with their original index so updates/deletes work
    const housing: { item: FixedExpense; index: number }[] = [];
    const personal: { item: FixedExpense; index: number }[] = [];
    fixedExpenses.forEach((item, i) => {
        if (item.category === 'housing') housing.push({ item, index: i });
        else personal.push({ item, index: i });
    });

    return (
        <section className='w-full my-8'>
            <TypographyH2>Faste utgifter</TypographyH2>
            <TypographyP>
                Legg til dine faste utgifter her. Du kan dele dem inn i
                boligrelaterte og personlige utgifter for bedre oversikt. De
                forhåndsutfylte utgiftene er bare forslag, og du kan endre eller
                fjerne dem etter behov.
            </TypographyP>

            <div className='grid gap-6 md:grid-cols-2'>
                <div>
                    <h3 className='font-semibold mb-2'>Bolig</h3>
                    <div className='overflow-auto rounded-md border'>
                        <table className='w-full table-fixed text-sm'>
                            <thead>
                                <tr className='bg-muted text-sm'>
                                    <th className='p-2 text-left w-3/4'>
                                        Beskrivelse
                                    </th>
                                    <th className='p-2 text-left w-1/4'>
                                        Beløp (kr)
                                    </th>
                                    <th className='p-2 w-12'> </th>
                                </tr>
                            </thead>
                            <tbody>
                                {housing.map(({ item, index }) => (
                                    <tr
                                        key={index}
                                        className='odd:bg-background even:bg-muted/5'
                                    >
                                        <td className='p-2 pb-0'>
                                            <Input
                                                id={`fixed-desc-${index}`}
                                                value={item.description}
                                                onChange={(e) =>
                                                    updateExpense(index, {
                                                        description:
                                                            e.target.value,
                                                    })
                                                }
                                            />
                                        </td>
                                        <td className='p-2 pb-0 pl-0 pr-0'>
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
                                                className=' text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
                                                size='icon'
                                                onClick={() =>
                                                    deleteExpense(index)
                                                }
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
                                <tr className='border-t font-semibold text-sm'>
                                    <td className='p-2 pl-4 '>Totalt</td>
                                    <td className='p-2 pl-4 ' colSpan={2}>
                                        {housing
                                            .reduce(
                                                (total, { item }) =>
                                                    total + item.amount,
                                                0
                                            )
                                            .toLocaleString()}{' '}
                                        kr / mnd
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <Button
                        variant='outline'
                        onClick={() => addExpense('housing')}
                        className='w-full mt-2'
                    >
                        + Legg til utgift
                    </Button>
                </div>

                <div>
                    <h3 className='font-semibold mb-2'>Personlig</h3>
                    <div className='overflow-auto rounded-md border'>
                        <table className='w-full table-fixed text-sm'>
                            <thead>
                                <tr className='bg-muted'>
                                    <th className='p-2 text-left w-3/4'>
                                        Beskrivelse
                                    </th>
                                    <th className='p-2 text-left w-1/4'>
                                        Beløp
                                    </th>
                                    <th className='p-2 w-12'> </th>
                                </tr>
                            </thead>
                            <tbody>
                                {personal.map(({ item, index }) => (
                                    <tr key={index}>
                                        <td className='p-2 pb-0'>
                                            <Input
                                                id={`fixed-desc-${index}`}
                                                value={item.description}
                                                onChange={(e) =>
                                                    updateExpense(index, {
                                                        description:
                                                            e.target.value,
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
                                                className=' text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
                                                onClick={() =>
                                                    deleteExpense(index)
                                                }
                                            >
                                                <Trash />
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                                {/* TODO - refactor to not use empty rows for spacing */}
                                <tr>
                                    <td className='p-2 pb-0'> </td>
                                    <td className='p-2 pb-0'> </td>
                                    <td className='p-2 pb-0'> </td>
                                </tr>
                                <tr className='border-t font-semibold'>
                                    <td className='p-2 pl-4 '>Totalt</td>
                                    <td className='p-2 pl-4 ' colSpan={2}>
                                        {personal
                                            .reduce(
                                                (total, { item }) =>
                                                    total + item.amount,
                                                0
                                            )
                                            .toLocaleString()}{' '}
                                        kr / mnd
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <Button
                        variant='outline'
                        className='w-full mt-2'
                        onClick={() => addExpense('personal')}
                    >
                        + Legg til utgift
                    </Button>
                </div>
            </div>
        </section>
    );
}
