'use client';

import IncomeCard from '@/components/incomeCard';
import { Button } from '@/components/ui/button';
import type { EconomyData, Income } from '@/types';
import FixedExpenses from '@/views/fixedExpensen';
import HousingLoan from '@/views/housingLoan';
import Incomes from '@/views/incomes';
import LivingExpenses from '@/views/livingExpenses';
import StudentLoan from '@/views/studentLoan';
import Summary from '@/views/summary';
import Taxes from '@/views/taxes';
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
        // TODO - fix correct deletion
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
                <Incomes data={data} setData={setData} />
                <HousingLoan data={data} setData={setData} />
                <StudentLoan data={data} setData={setData} />
                <FixedExpenses data={data} setData={setData} />
                <LivingExpenses data={data} setData={setData} />
                <Taxes data={data} setData={setData} />
                <Summary data={data} />
            </section>
        </>
    );
}
