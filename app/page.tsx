'use client';

import { Separator } from '@/components/ui/separator';
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
            <div className='w-full h-16 mt-8 relative text-left'>
                <h1 className='text-4xl md:text-5xl font-bold mb-4 text-brandBlue'>
                    NETTO
                </h1>
            </div>
            <div className='flex flex-col w-full m-auto justify-center mt-2'>
                <p className='w-full text-pretty'>
                    En økonomikalkulator for å få oversikt over din personlige
                    økonomi. Den hjelper deg å beregne inntekter, utgifter, lån
                    og skatter for å få en bedre forståelse av din økonomiske
                    situasjon og muligheter. Ved å fylle inn feltene under vil
                    du til slutt få en oppsummering av din netto økonomi, etter
                    skatter, lån, og andre utgifter.
                </p>
            </div>
            <section className='mt-24'>
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
