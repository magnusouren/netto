import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GraduationCap, Trash } from 'lucide-react';
import useStore, { StoreState } from '@/lib/store';
import type { Loan } from '@/types';
import {
    NativeSelect,
    NativeSelectOption,
} from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';
import { Questionmark } from '@/components/Questionmark';
import { Datepicker } from '@/components/Datepicker';

const loanAmounts: Record<string, number> = {
    '2025-2026': 166859,
    '2024-2025': 151960,
    '2023-2024': 137907,
    '2022-2023': 128889,
    '2021-2022': 126357,
    '2020-2021': 123519,
    '2019-2020': 121220,
    '2018-2019': 116369,
    '2017-2018': 111657,
    '2016-2017': 106549,
    '2015-2016': 100902,
    '2014-2015': 97850,
    '2013-2014': 94400,
    '2012-2013': 92500,
    '2011-2012': 90800,
    '2010-2011': 89000,
    '2009-2010': 87600,
    '2008-2009': 85000,
    '2007-2008': 82900,
    '2006-2007': 81400,
    '2005-2006': 80000,
    '2004-2005': 80000,
    '2003-2004': 80000,
    '2002-2003': 80000,
};

export default function Loans() {
    const loans = useStore((s: StoreState) => s.data.loans);
    const addLoan = useStore((s: StoreState) => s.addLoan);
    const updateLoan = useStore((s: StoreState) => s.updateLoan);
    const deleteLoan = useStore((s: StoreState) => s.deleteLoan);

    const [dialogOpen, setDialogOpen] = useState(false);

    const [form, setForm] = useState<Partial<Loan>>({
        description: '',
        loanAmount: 0,
        interestRate: 4.698,
        termYears: 20,
        termsPerYear: 12,
        monthlyFee: 0,
        startDate: '',
    });

    function openAddDialog() {
        setForm({
            description: '',
            loanAmount: 0,
            interestRate: 4.698,
            termYears: 20,
            termsPerYear: 12,
            monthlyFee: 0,
            startDate: new Date().toISOString().slice(0, 10),
        });
        setDialogOpen(true);
    }

    function submitAdd() {
        addLoan(form as Loan);
        setDialogOpen(false);
    }

    function handleUpdate(index: number, patch: Partial<Loan>) {
        updateLoan(index, patch);
    }

    function handleDelete(index: number) {
        deleteLoan(index);
    }

    const parseStartYear = (range: string) => Number(range.split('-')[0]);

    const sortedRanges = Object.entries(loanAmounts).sort((a, b) => {
        const ay = parseStartYear(a[0]);
        const by = parseStartYear(b[0]);
        return ay - by; // eldste -> nyeste
    });

    const [autoDialogOpen, setAutoDialogOpen] = useState(false);
    const [autoFrom, setAutoFrom] = useState<string>(
        sortedRanges[0]?.[0] ?? Object.keys(loanAmounts)[0]
    );
    const [autoTo, setAutoTo] = useState<string>(
        sortedRanges[sortedRanges.length - 1]?.[0] ??
            Object.keys(loanAmounts)[0]
    );
    const [extraStudentLoan, setExtraStudentLoan] = useState<number>(0);

    function handleAddStudentLoan() {
        const fromYear = parseStartYear(autoFrom);
        const toYear = parseStartYear(autoTo);

        let total = 0;

        for (const [range, amount] of sortedRanges) {
            const year = parseStartYear(range);
            if (year >= fromYear && year <= toYear) {
                total += amount;
            }
        }

        const loanAmount = total * 0.6 + extraStudentLoan;

        const startDate = `${toYear + 2}-01-01`;

        // add directly with calculated values
        addLoan({
            description: `Studielån ${loans.length + 1}`,
            loanAmount: loanAmount,
            interestRate: 4.698,
            termYears: 20,
            termsPerYear: 12,
            monthlyFee: 0,
            startDate: startDate,
        } as Loan);

        setAutoDialogOpen(false);
    }

    return (
        <section className='w-full my-8'>
            <TypographyH2>Lån</TypographyH2>
            <TypographyP>
                Legg inn informasjon om dine lån her. Dette kan være studielån,
                billån eller andre typer lån du har.
            </TypographyP>

            <Dialog open={autoDialogOpen} onOpenChange={setAutoDialogOpen}>
                <DialogTrigger asChild>
                    <Button className='w-full mb-2'>
                        Beregn ditt studielån <GraduationCap className='ml-2' />
                    </Button>
                </DialogTrigger>

                <DialogContent className='sm:max-w-lg'>
                    <DialogHeader>
                        <DialogTitle>Beregn studielån</DialogTitle>
                        <TypographyP>
                            Velg tidsperiode for studielånet ditt og eventuelt
                            ekstra lånebeløp. Du vil da få lagt til et studielån
                            som tilsvarer 60% av lånebeløpene for de valgte
                            årene. Tallene er basert på Lånekassens satser for
                            hvert studieår.
                        </TypographyP>
                    </DialogHeader>

                    <div className='grid gap-4'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-1'>
                                <Label htmlFor='from-year'>Studier fra</Label>
                                <NativeSelect
                                    id='from-year'
                                    value={autoFrom}
                                    onChange={(e) =>
                                        setAutoFrom(e.target.value)
                                    }
                                    className='w-full [&>div]:w-full [&_select]:w-full'
                                >
                                    {sortedRanges.map(([year]) => (
                                        <NativeSelectOption
                                            key={year}
                                            value={year}
                                        >
                                            {year}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </div>

                            <div className='space-y-1'>
                                <Label htmlFor='to-year'>Studier til</Label>
                                <NativeSelect
                                    id='to-year'
                                    value={autoTo}
                                    onChange={(e) => setAutoTo(e.target.value)}
                                >
                                    {sortedRanges.map(([year]) => (
                                        <NativeSelectOption
                                            key={year}
                                            value={year}
                                        >
                                            {year}
                                        </NativeSelectOption>
                                    ))}
                                </NativeSelect>
                            </div>

                            <div className='space-y-1 col-span-2'>
                                <Label htmlFor='extra-loan'>
                                    Ekstra lånebeløp – uten stipend (kr)
                                    <Questionmark helptext='Dersom du har ekstra lån som ikke kan omgjøres til stipend, kan du legge til det ekstra beløpet her.' />
                                </Label>
                                <Input
                                    id='extra-loan'
                                    type='number'
                                    value={extraStudentLoan}
                                    onChange={(e) =>
                                        setExtraStudentLoan(
                                            Number(e.target.value || 0)
                                        )
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
                        <Button type='button' onClick={handleAddStudentLoan}>
                            Sett lånebeløp
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {loans.length !== 0 && (
                <div className='overflow-auto rounded-md border mt-2'>
                    <table className='w-full table-auto text-sm'>
                        <thead>
                            <tr className='text-left bg-muted'>
                                <th className='p-2 min-w-32'>Beskrivelse</th>
                                <th className='p-2 min-w-32'>Lånebeløp (kr)</th>
                                <th className='p-2 min-w-32'>Rente (%)</th>
                                <th className='p-2 min-w-24'>År</th>
                                <th className='p-2 min-w-28'>Betalinger/år</th>
                                <th className='p-2 min-w-24'>Månedsavgift</th>
                                <th className='p-2 min-w-24'>Startdato</th>
                                <th className='w-12'></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loans.map((loan, idx) => (
                                <tr key={idx} className='align-top'>
                                    <td className='py-2 pl-2 pr-1 pb-0'>
                                        <Input
                                            type='text'
                                            value={loan.description}
                                            onChange={(e) =>
                                                handleUpdate(idx, {
                                                    description: e.target.value,
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='py-2 px-1'>
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
                                    <td className='py-2 px-1'>
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
                                    <td className='py-2 px-1'>
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
                                    <td className='py-2 px-1'>
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
                                    <td className='py-2 px-1'>
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
                                    <td className='py-2 px-1'>
                                        <Datepicker
                                            label=''
                                            dateValue={
                                                loan.startDate
                                                    ? new Date(loan.startDate)
                                                    : undefined
                                            }
                                            setDateValue={(date: Date) =>
                                                handleUpdate(idx, {
                                                    startDate: date
                                                        .toISOString()
                                                        .slice(0, 10),
                                                })
                                            }
                                        />
                                    </td>
                                    <td className='py-2 px-1'>
                                        <Button
                                            variant='ghost'
                                            size='icon'
                                            onClick={() => handleDelete(idx)}
                                            className='text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
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
                        className='mt-2 w-full'
                        size='sm'
                        onClick={openAddDialog}
                    >
                        + Legg til lån
                    </Button>
                </DialogTrigger>

                <DialogContent className='sm:max-w-lg'>
                    <DialogHeader>
                        <DialogTitle>Legg til lån</DialogTitle>
                    </DialogHeader>

                    <div className='grid gap-4 py-4'>
                        <div className='space-y-1'>
                            <Label htmlFor='loan-desc' className='gap-1'>
                                Beskrivelse
                                <Questionmark helptext='En beskrivelse av lånet, f.eks. hva det brukes til.' />
                            </Label>
                            <Input
                                id='loan-desc'
                                type='text'
                                value={form.description}
                                onChange={(e) =>
                                    setForm((p) => ({
                                        ...p,
                                        description: e.target.value,
                                    }))
                                }
                            />
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-1'>
                                <Label htmlFor='loan-amount' className='gap-1'>
                                    Lånebeløp (kr)
                                    <Questionmark helptext='Det totale lånebeløpet' />
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
                                <Label htmlFor='loan-rate' className='gap-1'>
                                    Rente (%)
                                    <Questionmark helptext='Den nominelle renten på lånet.' />
                                </Label>
                                <Input
                                    id='loan-rate'
                                    step='0.01'
                                    type='number'
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
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-1'>
                                <Label htmlFor='loan-years'>
                                    Nedbetalingstid
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
                                <Label htmlFor='loan-terms'>
                                    Betalinger/år
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
                                <Label htmlFor='loan-startdate'>
                                    Startdato
                                </Label>
                                <Datepicker
                                    label=''
                                    dateValue={
                                        form.startDate
                                            ? new Date(form.startDate)
                                            : undefined
                                    }
                                    setDateValue={(date: Date) =>
                                        setForm((p) => ({
                                            ...p,
                                            startDate: date
                                                .toISOString()
                                                .slice(0, 10),
                                        }))
                                    }
                                />
                            </div>

                            <div className='space-y-1'>
                                <Label htmlFor='loan-monthly'>
                                    Månedsavgift
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
