import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash } from 'lucide-react';
import useStore, { StoreState } from '@/lib/store';
import type { Loan } from '@/types';
import {
    NativeSelect,
    NativeSelectOption,
} from '@/components/ui/native-select';
import { Label } from '@/components/ui/label';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';

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

    const parseStartYear = (range: string) => Number(range.split('-')[0]);

    const sortedRanges = Object.entries(loanAmounts).sort((a, b) => {
        const ay = parseStartYear(a[0]);
        const by = parseStartYear(b[0]);
        return ay - by; // eldste -> nyeste
    });

    function handleAutoFill() {
        const selects = document.getElementsByTagName('select');
        const fromLabel =
            selects[selects.length - 2].selectedOptions[0].textContent!;
        const toLabel =
            selects[selects.length - 1].selectedOptions[0].textContent!;

        const fromYear = parseStartYear(fromLabel);
        const toYear = parseStartYear(toLabel);

        let total = 0;

        for (const [range, amount] of sortedRanges) {
            const year = parseStartYear(range);
            if (year >= fromYear && year <= toYear) {
                total += amount;
            }
        }

        const loanAmount = total * 0.6;

        handleAdd();
        handleUpdate(loans.length, {
            description: `Studielån ${loans.length + 1}`,
            loanAmount: loanAmount,
            interestRate: 4.698,
            termYears: 20,
            termsPerYear: 12,
            monthlyFee: 0,
        });
    }

    return (
        <section className='w-full my-8'>
            <TypographyH2>Studielån</TypographyH2>
            <TypographyP>
                Legg inn informasjon om ditt studielån her. Dersom du har tatt
                opp maksimalt lån og fått tildelt fullt stipend, kan du bruke
                knappen under for å autogenerere lånebeløpet basert på start- og
                sluttdato for studielånet ditt. Har du tatt opp mer lån eller i
                ulike perioder kan du manuelt endre lånet eller legge inn dette
                som nye lån.
            </TypographyP>

            <div className='mt-2 p-2 md:pl-4 border rounded-md'>
                <div className='flex justify-start gap-4 items-end md:items-center flex-wrap'>
                    {/* FROM */}
                    <div className='flex flex-col gap-2 md:flex-row'>
                        <Label htmlFor='from-year'>Fra:</Label>
                        <NativeSelect name='from-year'>
                            {Object.entries(loanAmounts).map(
                                ([year, amount]) => (
                                    <NativeSelectOption
                                        key={year}
                                        value={amount}
                                    >
                                        {year}
                                    </NativeSelectOption>
                                )
                            )}
                        </NativeSelect>
                    </div>

                    {/* TO */}
                    <div className='flex flex-col gap-2 md:flex-row'>
                        <Label htmlFor='to-year'>Til:</Label>
                        <NativeSelect name='to-year'>
                            {Object.entries(loanAmounts).map(
                                ([year, amount]) => (
                                    <NativeSelectOption
                                        key={year}
                                        value={amount}
                                    >
                                        {year}
                                    </NativeSelectOption>
                                )
                            )}
                        </NativeSelect>
                    </div>

                    <Button variant='outline' onClick={handleAutoFill}>
                        Sett lånebeløp
                    </Button>
                </div>
            </div>

            {loans.length !== 0 && (
                <div className='overflow-auto rounded-md border mt-2'>
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
            <Button
                variant='outline'
                className='mt-2 w-full'
                size='sm'
                onClick={handleAdd}
            >
                + Legg til lån
            </Button>
        </section>
    );
}
