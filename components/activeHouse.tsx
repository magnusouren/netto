'use client';

import Link from 'next/link';
import useStore, { StoreState } from '@/lib/store';
import { Glance } from '@/components/ledger/Glance';
import { Questionmark } from '@/components/Questionmark';
import { formatNumberToNOK } from '@/lib/utils';

export default function ActiveHouse() {
    const activeHouse = useStore((s: StoreState) =>
        (s.data.houses || []).find((h) => h.id === s.data.activeHouseId)
    );
    const housesCount = useStore(
        (s: StoreState) => (s.data.houses || []).length
    );

    return (
        <section className='w-full my-8'>
            <Glance
                density='compact'
                title={
                    <span className='inline-flex items-center gap-1.5'>
                        {activeHouse ? activeHouse.name : 'Ingen bolig valgt'}
                        <Questionmark helptext='Boligen som brukes i beregningene. Boliglån og boligkostnader administreres på boligsiden. Bytt eller legg til via lenken her.' />
                    </span>
                }
                subtitle='Bolig & boliglån'
                indexLabel={
                    <Link
                        href='/houses'
                        className='inline-flex items-center gap-1.5 px-2.5 py-1 border border-foreground/40 text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-colors'
                    >
                        {housesCount === 0 ? 'Legg til →' : 'Se boliger →'}
                    </Link>
                }
            >
                {activeHouse ? (
                    <>
                        <Glance.Row
                            label='Pris'
                            value={formatNumberToNOK(
                                activeHouse.purchase.price
                            )}
                        />
                        <Glance.Row
                            label='Lånebeløp'
                            value={formatNumberToNOK(
                                activeHouse.housingLoan.loanAmount
                            )}
                        />
                        <Glance.Row
                            label='Rente'
                            value={`${activeHouse.housingLoan.interestRate}%`}
                        />
                    </>
                ) : (
                    <p className='py-3 text-sm text-muted-foreground'>
                        Velg en aktiv bolig fra boligsiden for å se nøkkeltall
                        og koble lånet til budsjettet.
                    </p>
                )}
            </Glance>
        </section>
    );
}
