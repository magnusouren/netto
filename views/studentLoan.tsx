import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EconomyData, Loan } from '@/types';
import { Trash } from 'lucide-react';

interface StudentLoanProps {
    data: EconomyData;
    setData: React.Dispatch<React.SetStateAction<EconomyData>>;
}

export default function StudentLoan({ data, setData }: StudentLoanProps) {
    function addLoan() {
        setData((prev) => ({
            ...prev,
            loans: [
                ...prev.loans,
                {
                    description: '',
                    loanAmount: 0,
                    interestRate: 4.841,
                    termYears: 20,
                    termsPerYear: 12,
                    monthlyFee: 0,
                } as Loan,
            ],
        }));
    }

    function updateLoan(index: number, patch: Partial<Loan>) {
        setData((prev) => {
            const loans = [...prev.loans];
            loans[index] = { ...loans[index], ...patch } as Loan;
            return { ...prev, loans };
        });
    }

    function deleteLoan(index: number) {
        setData((prev) => {
            const loans = prev.loans.filter((_, i) => i !== index);
            return { ...prev, loans };
        });
    }

    const totalLoanAmount = data.loans.reduce(
        (total, loan) => total + loan.loanAmount,
        0
    );

    return (
        <section className='w-full my-8'>
            <div className='flex items-center justify-between mb-2'>
                <h2 className='text-xl font-semibold'>
                    Studielån – {totalLoanAmount.toLocaleString()} kr
                </h2>
                <Button variant='outline' size='sm' onClick={addLoan}>
                    + Legg til lån
                </Button>
            </div>
            <p className='mt-2 mb-4 text-muted-foreground'>
                Legg inn informasjon om ditt studielån her. Du kan legge til
                flere lån dersom du har flere. Du kan også legge til andre typer
                lån her dersom du har det.
            </p>

            {data.loans.length !== 0 && (
                <div className='overflow-auto rounded-md border'>
                    <table className='w-full table-auto text-sm'>
                        <thead>
                            <tr className='text-left bg-muted'>
                                <th className='p-2'>Beskrivelse</th>
                                <th className='p-2'>Lånebeløp (kr)</th>
                                <th className='p-2'>Rente (%)</th>
                                <th className='p-2'>År</th>
                                <th className='p-2'>Betalinger/år</th>
                                <th className='p-2'>Månedsavgift</th>
                                <th className='w-12'></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.loans.map((loan, idx) => (
                                <tr key={idx} className='align-top'>
                                    <td className='p-2'>
                                        {loan.description ||
                                            `Studielån ${idx + 1}`}
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
                                            size='icon-sm'
                                            onClick={() => deleteLoan(idx)}
                                            className=' text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
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
