import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash } from 'lucide-react';
import useStore, { StoreState } from '@/lib/store';
import type { Loan } from '@/types';

export default function StudentLoan() {
    const loans = useStore((s: StoreState) => s.data.loans);
    const addLoan = useStore((s: StoreState) => s.addLoan);
    const updateLoan = useStore((s: StoreState) => s.updateLoan);
    const deleteLoan = useStore((s: StoreState) => s.deleteLoan);

    function handleAdd() {
        addLoan();
    }

    function handleUpdate(index: number, patch: Partial<Loan>) {
        updateLoan(index, patch);
    }

    function handleDelete(index: number) {
        deleteLoan(index);
    }

    const totalLoanAmount = loans.reduce(
        (total, loan) => total + loan.loanAmount,
        0
    );

    return (
        <section className='w-full my-8'>
            <div className='flex items-center justify-between mb-2'>
                <h2 className='text-xl font-semibold'>
                    Studielån – {totalLoanAmount.toLocaleString()} kr
                </h2>
                <Button variant='outline' size='sm' onClick={handleAdd}>
                    + Legg til lån
                </Button>
            </div>
            <p className='mt-2 mb-4 text-muted-foreground'>
                Legg inn informasjon om ditt studielån her. Du kan legge til
                flere lån dersom du har flere. Du kan også legge til andre typer
                lån her dersom du har det.
            </p>

            {loans.length !== 0 && (
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
                            {loans.map((loan, idx) => (
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
                                                handleUpdate(idx, {
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
                                                handleUpdate(idx, {
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
                                                handleUpdate(idx, {
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
                                                handleUpdate(idx, {
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
                                                handleUpdate(idx, {
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
                                            onClick={() => handleDelete(idx)}
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
