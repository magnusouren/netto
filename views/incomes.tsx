import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash } from 'lucide-react';
import useStore, { StoreState } from '@/lib/store';
import type { Income } from '@/types';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';
import { Checkbox } from '@/components/ui/checkbox';

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
            <TypographyH2>Inntekter</TypographyH2>
            <TypographyP>
                Legg til dine årlige netto faste inntekter nedenfor.
            </TypographyP>
            {incomes.length !== 0 && (
                <div className='overflow-auto rounded-md border'>
                    <table className='table-fixed text-sm'>
                        <thead>
                            <tr className='bg-muted'>
                                <th className='p-2 w-5/12 text-left md:w-3/4'>
                                    Kilde
                                </th>
                                <th className='p-2 w-5/12 md:w-1/4 text-left'>
                                    Beløp
                                </th>
                                <th className=' w-1/12 md:w-12 text-center'>
                                    Skattefritt
                                </th>
                                <th className='p-2 w-1/12 md:w-12'></th>
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
                                            value={income.source || ''}
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
                                            value={income.amount || ''}
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
                                    <td className='p-2 text-center'>
                                        <Checkbox
                                            id={`income-taxFree-${index}`}
                                            checked={!!income.taxFree}
                                            className='h-4 w-4 border'
                                            onCheckedChange={(checked) =>
                                                updateIncome(index, {
                                                    taxFree: !!checked,
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='text-center p-2'>
                                        <Button
                                            variant='ghost'
                                            className=' text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
                                            size='icon'
                                            onClick={() => deleteIncome(index)}
                                        >
                                            <Trash />
                                        </Button>
                                    </td>
                                </tr>
                            ))}

                            <tr className='border-t font-semibold'>
                                <td className='p-2 pl-4 '>Totalt</td>
                                <td className='p-2 pl-4 '>
                                    {totalIncome.toLocaleString()}
                                </td>
                                <td></td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
            <Button
                variant='outline'
                size='sm'
                className='mt-2 w-full'
                onClick={() => addIncome()}
            >
                <Plus /> Legg til inntekt
            </Button>
        </section>
    );
}
