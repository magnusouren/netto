'use client';

import Link from 'next/link';
import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyP } from '@/components/typography/typographyP';
import FixedExpenses from '@/views/fixedExpenses';
import Incomes from '@/views/incomes';
import LivingExpenses from '@/views/livingExpenses';
import StudentLoan from '@/views/loans';
import Summary from '@/views/summary';
import useStore, { StoreState } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function Data() {
    const activeHouse = useStore((s: StoreState) =>
        (s.data.houses || []).find((h) => h.id === s.data.activeHouseId)
    );
    const housesCount = useStore(
        (s: StoreState) => (s.data.houses || []).length
    );

    return (
        <>
            <div className='container my-8 min-h-24'>
                <TypographyH1>Grunnlagsdata</TypographyH1>
                <TypographyP>
                    Her legger du inn all din økonomiske data for å få en
                    oversikt over din økonomi på tvers av de ulike sidene som du
                    finner her. Alt av data blir lagret lokalt i din nettleser,
                    og blir ikke delt med noen andre.
                </TypographyP>
            </div>

            <section className='container'>
                {/* Active House Info */}
                <div className='mb-8 p-4 border rounded-md bg-muted/30'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                            <Home className='w-5 h-5 text-muted-foreground' />
                            <div>
                                <p className='font-medium'>
                                    {activeHouse
                                        ? `Aktiv bolig: ${activeHouse.name}`
                                        : 'Ingen bolig valgt'}
                                </p>
                                {activeHouse && (
                                    <p className='text-sm text-muted-foreground'>
                                        Lån:{' '}
                                        {activeHouse.housingLoan.loanAmount.toLocaleString(
                                            'nb-NO'
                                        )}{' '}
                                        kr • Rente:{' '}
                                        {activeHouse.housingLoan.interestRate}%
                                    </p>
                                )}
                            </div>
                        </div>
                        <Link href='/houses'>
                            <Button variant='outline'>
                                {housesCount === 0
                                    ? 'Legg til bolig'
                                    : 'Administrer boliger'}
                            </Button>
                        </Link>
                    </div>
                </div>

                <Incomes />
                <StudentLoan />
                <FixedExpenses />
                <LivingExpenses />
                <Summary />
            </section>
        </>
    );
}
