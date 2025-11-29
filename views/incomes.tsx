import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EconomyData } from '@/types';
import { Plus, Trash } from 'lucide-react';

interface IncomesProps {
    data: EconomyData;
    setData: React.Dispatch<React.SetStateAction<EconomyData>>;
}

export default function Incomes({ data, setData }: IncomesProps) {
    const { incomes } = data;
    const totalIncome = incomes.reduce(
        (total, income) => total + income.amount,
        0
    );

    return (
        <section className='w-full my-8'>
            <div className='flex items-center justify-between'>
                <h2 className='text-xl font-semibold'>
                    Inntekter – {totalIncome.toLocaleString()} kr
                </h2>
                <Button
                    variant='outline'
                    size='sm'
                    onClick={() =>
                        setData((prev) => ({
                            ...prev,
                            incomes: [
                                ...prev.incomes,
                                { source: '', amount: 0 },
                            ],
                        }))
                    }
                >
                    <Plus /> Legg til inntekt
                </Button>
            </div>
            <p className='mt-2 mb-4 text-muted-foreground'>
                Legg til dine faste inntekter, per år
            </p>
            {data.incomes.length !== 0 && (
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
                            {incomes.map((income, index) => (
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
                                                setData((prev) => {
                                                    const list = [
                                                        ...prev.incomes,
                                                    ];
                                                    list[index] = {
                                                        ...list[index],
                                                        source: e.target.value,
                                                    };
                                                    return {
                                                        ...prev,
                                                        incomes: list,
                                                    };
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
                                                setData((prev) => {
                                                    const list = [
                                                        ...prev.incomes,
                                                    ];
                                                    list[index] = {
                                                        ...list[index],
                                                        amount: Number(
                                                            e.target.value || 0
                                                        ),
                                                    };
                                                    return {
                                                        ...prev,
                                                        incomes: list,
                                                    };
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='text-center'>
                                        <Button
                                            variant='outline'
                                            className=' text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
                                            size='icon-sm'
                                            onClick={() =>
                                                setData((prev) => {
                                                    const list =
                                                        prev.incomes.filter(
                                                            (_, i) =>
                                                                i !== index
                                                        );
                                                    return {
                                                        ...prev,
                                                        incomes: list,
                                                    };
                                                })
                                            }
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
