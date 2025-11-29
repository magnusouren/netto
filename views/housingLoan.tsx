import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EconomyData, HousingLoan } from '@/types';
import { Trash } from 'lucide-react';

interface HousingLoanProps {
    data: EconomyData;
    setData: React.Dispatch<React.SetStateAction<EconomyData>>;
}

export default function HousingLoan({ data, setData }: HousingLoanProps) {
    function addLoan() {
        setData((prev) => ({
            ...prev,
            housingLoans: [
                ...prev.housingLoans,
                {
                    capital: 0,
                    description: '',
                    loanAmount: 0,
                    interestRate: 0,
                    termYears: 25,
                    termsPerYear: 12,
                    monthlyFee: 65,
                } as HousingLoan,
            ],
        }));
    }

    function updateLoan(index: number, patch: Partial<HousingLoan>) {
        setData((prev) => {
            const loans = [...prev.housingLoans];
            loans[index] = { ...loans[index], ...patch } as HousingLoan;
            return { ...prev, housingLoans: loans };
        });
    }

    function deleteLoan(index: number) {
        setData((prev) => {
            const loans = prev.housingLoans.filter((_, i) => i !== index);
            return { ...prev, housingLoans: loans };
        });
    }

    const totalLoanAmount = data.housingLoans.reduce(
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

            {data.housingLoans.length !== 0 && (
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
                            {data.housingLoans.map((loan, idx) => (
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
