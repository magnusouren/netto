'use client';

// top-level page — views import UI components themselves and read the store
import FixedExpenses from '@/views/fixedExpensen';
import HousingLoan from '@/views/housingLoan';
import Incomes from '@/views/incomes';
import LivingExpenses from '@/views/livingExpenses';
import StudentLoan from '@/views/studentLoan';
import Summary from '@/views/summary';
import Taxes from '@/views/taxes';

export default function Home() {
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
                <Incomes />
                <HousingLoan />
                <StudentLoan />
                <FixedExpenses />
                <LivingExpenses />
                <Taxes />
                <Summary />
            </section>
        </>
    );
}
