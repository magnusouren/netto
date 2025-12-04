import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CircleQuestionMark, Trash } from 'lucide-react';
import useStore, { StoreState } from '@/lib/store';
import type { HousingLoan } from '@/types';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Questionmark } from '@/components/Questionmark';

export default function HousingLoan() {
    const housingLoans = useStore((s: StoreState) => s.data.housingLoans);
    const addHousingLoan = useStore((s: StoreState) => s.addHousingLoan);
    const updateHousingLoan = useStore((s: StoreState) => s.updateHousingLoan);
    const deleteHousingLoan = useStore((s: StoreState) => s.deleteHousingLoan);

    const [dialogOpen, setDialogOpen] = useState(false);

    // form state for the add-dialog
    const [form, setForm] = useState<Partial<HousingLoan>>({
        description: '',
        capital: 0,
        loanAmount: 0,
        interestRate: 4.841,
        termYears: 20,
        termsPerYear: 12,
        monthlyFee: 0,
    });

    function openAddDialog() {
        // reset form to defaults when opening
        setForm({
            description: '',
            capital: 0,
            loanAmount: 0,
            interestRate: 5.0,
            termYears: 25,
            termsPerYear: 12,
            startDate: new Date().toISOString().slice(0, 10),
            monthlyFee: 0,
        });
        setDialogOpen(true);
    }

    function submitAdd() {
        addHousingLoan(form);
        setDialogOpen(false);
    }

    function updateLoan(index: number, patch: Partial<HousingLoan>) {
        updateHousingLoan(index, patch);
    }

    function deleteLoan(index: number) {
        deleteHousingLoan(index);
    }

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
                                <th className='p-2 min-w-32'>Beskrivelse</th>
                                <th className='p-2 min-w-32'>
                                    Egenkapital (kr)
                                </th>
                                <th className='p-2 min-w-32'>Lånebeløp (kr)</th>
                                <th className='p-2 min-w-24'>Rente (%)</th>
                                <th className='p-2 min-w-22'>
                                    Nedbetalingstid
                                </th>
                                <th className='p-2 min-w-28'>Betalinger/år</th>
                                <th className='p-2 min-w-24'>Månedsavgift</th>
                                <th className='p-2 min-w-36'>Startdato</th>
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
                                        <Input
                                            type='date'
                                            value={loan.startDate ?? ''}
                                            onChange={(e) =>
                                                updateLoan(idx, {
                                                    startDate: e.target.value,
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
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                    <Button
                        variant='outline'
                        size='sm'
                        className='mt-2 w-full'
                        onClick={openAddDialog}
                    >
                        + Legg til lån
                    </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-lg'>
                    <DialogHeader>
                        <DialogTitle>Legg til boliglån</DialogTitle>
                    </DialogHeader>

                    <div className='grid gap-4 py-4'>
                        <div className='space-y-1'>
                            <Label htmlFor='loan-description' className='gap-1'>
                                Beskrivelse
                                <Questionmark helptext='En beskrivelse av lånet, f.eks. adressen på boligen.' />
                            </Label>
                            <Input
                                id='loan-description'
                                type='text'
                                value={form.description}
                                placeholder='Karl Johan 1'
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        description: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className='space-y-1'>
                            <Label htmlFor='loan-capital' className='gap-1'>
                                Egenkapital (kr)
                                <Questionmark helptext='Brukes til å beregne totalverdien på din bolig.' />
                            </Label>
                            <Input
                                id='loan-capital'
                                type='number'
                                value={form.capital}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        capital: Number(e.target.value || 0),
                                    }))
                                }
                            />
                        </div>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-1'>
                                <Label htmlFor='loan-amount' className='gap-1'>
                                    Lånebeløp (kr)
                                    <Questionmark helptext='Beløpet du låner fra banken.' />
                                </Label>
                                <Input
                                    id='loan-amount'
                                    type='number'
                                    value={form.loanAmount}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            loanAmount: Number(
                                                e.target.value || 0
                                            ),
                                        }))
                                    }
                                />
                            </div>

                            <div className='space-y-1'>
                                <Label
                                    htmlFor='loan-rate'
                                    className='flex gap-1'
                                >
                                    Rente (%)
                                    <Questionmark helptext='Nominell rente for lånet.' />
                                </Label>
                                <Input
                                    id='loan-rate'
                                    type='number'
                                    step='0.01'
                                    value={form.interestRate}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            interestRate: Number(
                                                e.target.value || 0
                                            ),
                                        }))
                                    }
                                />
                            </div>
                            <div className='space-y-1'>
                                <Label htmlFor='loan-years' className='gap-1'>
                                    Nedbetalingstid
                                    <Questionmark helptext='Antall år du planlegger å betale ned lånet.' />
                                </Label>
                                <Input
                                    id='loan-years'
                                    type='number'
                                    value={form.termYears}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            termYears: Number(
                                                e.target.value || 0
                                            ),
                                        }))
                                    }
                                />
                            </div>
                            <div className='space-y-1'>
                                <Label htmlFor='loan-terms' className='gap-1'>
                                    Betalinger/år
                                    <Questionmark helptext='Antall betalinger per år. Vanligvis 12 for månedlige betalinger.' />
                                </Label>
                                <Input
                                    id='loan-terms'
                                    type='number'
                                    value={form.termsPerYear}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            termsPerYear: Number(
                                                e.target.value || 0
                                            ),
                                        }))
                                    }
                                />
                            </div>

                            <div className='space-y-1'>
                                <Label
                                    htmlFor='loan-startdate'
                                    className='gap-1'
                                >
                                    Startdato
                                    <Questionmark helptext='Datoen når lånet startet.' />
                                </Label>
                                <Input
                                    id='loan-startdate'
                                    type='date'
                                    value={form.startDate}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            startDate: e.target.value,
                                        }))
                                    }
                                />
                            </div>

                            <div className='space-y-1'>
                                <Label htmlFor='loan-monthly' className='gap-1'>
                                    Månedsavgift
                                    <Questionmark helptext='Eventuelle løpende månedsavgifter for lånet.' />
                                </Label>
                                <Input
                                    id='loan-monthly'
                                    type='number'
                                    value={form.monthlyFee}
                                    onChange={(e) =>
                                        setForm((p) => ({
                                            ...p,
                                            monthlyFee: Number(
                                                e.target.value || 0
                                            ),
                                        }))
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className='sm:justify-start gap-2'>
                        <DialogClose asChild>
                            <Button type='button' variant='secondary'>
                                Avbryt
                            </Button>
                        </DialogClose>
                        <Button type='button' onClick={submitAdd}>
                            Legg til lån
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </section>
    );
}
