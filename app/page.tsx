'use client';

import IncomeCard from '@/components/incomeCard';
import { Button } from '@/components/ui/button';
import type { EconomyData, Income } from '@/types';
import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';

export default function Home() {
    const [data, setData] = useState<EconomyData>({
        incomes: [],
        housingLoans: [],
        loans: [],
        fixedExpenses: [],
        livingCosts: [],
    });

    const totalIncome = data.incomes.reduce(
        (total, income) => total + income.amount,
        0
    );

    const addIncome = useCallback(() => {
        setData((prev) => ({
            ...prev,
            incomes: [...prev.incomes, { source: '', amount: 0 }],
        }));
    }, []);

    const updateIncome = useCallback((index: number, updated: Income) => {
        setData((prev) => {
            const incomes = [...prev.incomes];
            incomes[index] = updated;
            return { ...prev, incomes };
        });
    }, []);

    const deleteIncome = useCallback((index: number) => {
        setData((prev) => {
            const incomes = prev.incomes.filter((_, i) => i !== index);
            return {
                ...prev,
                incomes:
                    incomes.length === 0
                        ? [{ source: '', amount: 0 }]
                        : incomes,
            };
        });
    }, []);

    return (
        <>
            <div className='flex flex-col w-full m-auto justify-center'>
                <h1 className='text-4xl mb-4 font-bold'>Økonomikalkulator</h1>
                <p>
                    Lorem ipsum dolor sit amet consectetur, adipisicing elit.
                    Repellat sed tempora ea dolorem, nesciunt temporibus amet
                    cum, error quaerat provident libero repudiandae aliquam odit
                    similique harum hic consequuntur, minus vel.
                </p>
            </div>
            <section className='mt-8'>
                <div className='my-8'>
                    <h2 className='text-3xl font-semibold mb-2'>
                        Inntekter – {totalIncome} kr
                    </h2>
                    <p className='mb-4 border-l-2 pl-2 text-gray-500'>
                        Dine faste inntektskilder, som lønn og andre
                        regelmessige inntekter. Legg inn hvor mye du tjener per
                        år.
                    </p>
                    <div className='grid grid-cols-4 gap-4 mb-4'>
                        {data.incomes.length === 0 && (
                            <IncomeCard
                                initialIncome={{ source: '', amount: 0 }}
                                onSubmit={(updated) => updateIncome(0, updated)}
                                onDelete={() => deleteIncome(0)}
                            />
                        )}
                        {data.incomes.map((income, index) => (
                            <IncomeCard
                                key={index}
                                initialIncome={income}
                                onSubmit={(updated) =>
                                    updateIncome(index, updated)
                                }
                                onDelete={() => deleteIncome(index)}
                            />
                        ))}
                        <div className='grid col-span-1 items-center'>
                            <Button
                                variant='outline'
                                className='p-4 flex items-center justify-center'
                                onClick={addIncome}
                            >
                                <Plus />
                                Legg til ny inntekt
                            </Button>
                        </div>
                    </div>
                </div>
                <div>
                    <h2 className='text-3xl font-semibold mb-4'>Boliglån</h2>
                </div>
                <h2 className='text-3xl font-semibold mb-4'>Studielån</h2>
                <h2 className='text-3xl font-semibold mb-4'>
                    Faste utgifter – bolig
                </h2>
                <h2 className='text-3xl font-semibold mb-4'>
                    Faste utgifter – personlig
                </h2>
                <h2 className='text-3xl font-semibold mb-4'>Levekostnader</h2>
                <h2 className='text-3xl font-semibold mb-4'>Skattedetaljer</h2>
            </section>
        </>
    );
}
