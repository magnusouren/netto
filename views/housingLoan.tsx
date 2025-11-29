import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash } from 'lucide-react';
import useStore, { StoreState } from '@/lib/store';
import type { HousingLoan } from '@/types';

export default function HousingLoan() {
    const housingLoans = useStore((s: StoreState) => s.data.housingLoans);
    const addHousingLoan = useStore((s: StoreState) => s.addHousingLoan);
    const updateHousingLoan = useStore((s: StoreState) => s.updateHousingLoan);
    const deleteHousingLoan = useStore((s: StoreState) => s.deleteHousingLoan);

    function addLoan() {
        addHousingLoan();
    }

    function updateLoan(index: number, patch: Partial<HousingLoan>) {
        updateHousingLoan(index, patch);
    }

    function deleteLoan(index: number) {
        deleteHousingLoan(index);
    }

    const totalLoanAmount = housingLoans.reduce(
        (total, loan) => total + loan.loanAmount,
        0
    );

    return (
        <section className='w-full my-8'>
            <div className='flex items-center justify-between mb-2'>
                <h2 className='text-xl font-semibold'>
                    Boliglån – {totalLoanAmount.toLocaleString()} kr
                </h2>
                <Button variant='outline' size='sm' onClick={addLoan}>
                    + Legg til lån
                </Button>
            </div>
            <p className='mt-2 mb-4 text-muted-foreground'>
                Legg til informasjon om boliglån. Feltene oppdaterer skjemaets
                data objekt direkte.
            </p>

            {housingLoans.length !== 0 && (
                <div className='overflow-auto rounded-md border'>
                    <table className='w-full table-auto text-sm'>
                        <thead>
                            <tr className='text-left bg-muted'>
                                <th className='p-2'>Beskrivelse</th>
                                <th className='p-2'>Egenkapital (kr)</th>
                                <th className='p-2'>Lånebeløp (kr)</th>
                                <th className='p-2'>Rente (%)</th>
                                <th className='p-2'>År</th>
                                <th className='p-2'>Betalinger/år</th>
                                <th className='p-2'>Månedsavgift</th>
                                <th className='w-12'></th>
                            </tr>
                        </thead>
                        <tbody>
                            {housingLoans.map((loan, idx) => (
                                <tr key={idx} className='align-top'>
                                    <td className='p-2'>
                                        {loan.description ||
                                            `Boliglån ${idx + 1}`}
                                    </td>
                                    <td className='p-2'>
                                        <Input
                                            type='number'
                                            value={loan.capital}
                                            onChange={(e) =>
                                                updateLoan(idx, {
                                                    capital: Number(
                                                        e.target.value || 0
                                                    ),
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='p-2'>
                                        <Input
                                            type='number'
                                            value={loan.loanAmount}
                                            onChange={(e) =>
                                                updateLoan(idx, {
                                                    loanAmount: Number(
                                                        e.target.value || 0
                                                    ),
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='p-2'>
                                        <Input
                                            type='number'
                                            step='0.01'
                                            value={loan.interestRate}
                                            onChange={(e) =>
                                                updateLoan(idx, {
                                                    interestRate: Number(
                                                        e.target.value || 0
                                                    ),
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='p-2'>
                                        <Input
                                            type='number'
                                            value={loan.termYears}
                                            onChange={(e) =>
                                                updateLoan(idx, {
                                                    termYears: Number(
                                                        e.target.value || 0
                                                    ),
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='p-2'>
                                        <Input
                                            type='number'
                                            value={loan.termsPerYear}
                                            onChange={(e) =>
                                                updateLoan(idx, {
                                                    termsPerYear: Number(
                                                        e.target.value || 0
                                                    ),
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='p-2'>
                                        <Input
                                            type='number'
                                            value={loan.monthlyFee ?? 0}
                                            onChange={(e) =>
                                                updateLoan(idx, {
                                                    monthlyFee: Number(
                                                        e.target.value || 0
                                                    ),
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='p-2'>
                                        <Button
                                            variant='outline'
                                            className=' text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
                                            size='icon-sm'
                                            onClick={() => deleteLoan(idx)}
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
