import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash } from 'lucide-react';
import useStore, { StoreState } from '@/lib/store';
import type { HousingLoan } from '@/types';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';

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
            <TypographyH2>Boliglån</TypographyH2>
            <TypographyP>
                Legg til informasjon om boliglån. Du kan legge til flere lån
                dersom du har det. Per nå støttes kun lån med en lånetaker,
                dersom det er flere lånetakere på lånet må du legge inn dine
                andeler av lånet her.
            </TypographyP>

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
                                    <td className='pl-2 pr-1 py-2'>
                                        <Input
                                            type='text'
                                            value={loan.description}
                                            onChange={(e) =>
                                                updateLoan(idx, {
                                                    description: e.target.value,
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='py-2 px-1'>
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
                                    <td className='py-2 px-1'>
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
                                    <td className='py-2 px-1'>
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
                                    <td className='py-2 px-1'>
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
                                    <td className='py-2 px-1'>
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
                                    <td className='py-2 px-1'>
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
                                    <td className='py-2 px-1'>
                                        <Button
                                            variant='ghost'
                                            className=' text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
                                            size='icon'
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
            <Button
                variant='outline'
                size='sm'
                className='mt-2 w-full'
                onClick={addLoan}
            >
                + Legg til lån
            </Button>
        </section>
    );
}
