import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash } from 'lucide-react';
import useStore, { StoreState } from '@/lib/store';
import type { Income } from '@/types';

export default function Incomes() {
    const incomes = useStore((s: StoreState) => s.data.incomes);
    const addIncome = useStore((s: StoreState) => s.addIncome);
    const updateIncome = useStore((s: StoreState) => s.updateIncome);
    const deleteIncome = useStore((s: StoreState) => s.deleteIncome);

    const totalIncome = incomes.reduce(
        (total: number, income: Income) => total + income.amount,
        0
    );

    return (
        <section className='w-full my-8'>
            <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>
                    Inntekter – {totalIncome.toLocaleString()} kr
                </h2>
                <Button variant='outline' size='sm' onClick={() => addIncome()}>
                    <Plus /> Legg til inntekt
                </Button>
            </div>
            <p className='mt-2 mb-4 text-muted-foreground'>
                Legg til dine faste inntekter, per år
            </p>
            {incomes.length !== 0 && (
                <div className='overflow-auto rounded-md border'>
                    <table className='w-full table-fixed'>
                        <thead>
                            <tr className='bg-muted text-sm'>
                                <th className='p-2 text-left w-3/4'>Kilde</th>
                                <th className='p-2 w-1/4 text-left'>
                                    Beløp (kr)
                                </th>
                                <th className='w-12'> </th>
                            </tr>
                        </thead>
                        <tbody>
                            {incomes.map((income: Income, index: number) => (
                                <tr
                                    key={index}
                                    className='odd:bg-background even:bg-muted/5'
                                >
                                    <td className='p-2'>
                                        <Input
                                            id={`income-source-${index}`}
                                            type='text'
                                            value={income.source}
                                            placeholder={`Fast jobb`}
                                            onChange={(e) =>
                                                updateIncome(index, {
                                                    source: e.target.value,
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='p-2'>
                                        <Input
                                            id={`income-amount-${index}`}
                                            type='number'
                                            value={income.amount}
                                            placeholder='500 000'
                                            onChange={(e) =>
                                                updateIncome(index, {
                                                    amount: Number(
                                                        e.target.value || 0
                                                    ),
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='text-center'>
                                        <Button
                                            variant='outline'
                                            className=' text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
                                            size='icon-sm'
                                            onClick={() => deleteIncome(index)}
                                        >
                                            <Trash />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
