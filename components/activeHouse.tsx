'use client';

import Link from 'next/link';
import useStore, { StoreState } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

export default function ActiveHouse() {
    const activeHouse = useStore((s: StoreState) =>
        (s.data.houses || []).find((h) => h.id === s.data.activeHouseId)
    );
    const housesCount = useStore(
        (s: StoreState) => (s.data.houses || []).length
    );
    return (
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
    );
}
