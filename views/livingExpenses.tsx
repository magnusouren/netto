import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    NativeSelect,
    NativeSelectOption,
} from '@/components/ui/native-select';
import useStore, { StoreState } from '@/lib/store';
import type { LivingCost } from '@/types';
import { Cog, Trash } from 'lucide-react';
import Link from 'next/link';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';

type AutoFormState = {
    select_year: string;
    inntekt: string;
    antall_biler: string;
    antall_elbiler: string;
    kjonn0: 'm' | 'k';
    alder0: string;
    barnehage0: string;
    sfo0: string;
    sfogratis0: string;
    gravid0: string;
    student0: string;
    pensjonist0: string;
    lang: 'no' | 'en';
};

type BudgetResponse = {
    utgifter: {
        individspesifikke: Record<string, number>;
        husholdsspesifikke: Record<string, number>;
    };
    utgifterBeskrivelser: {
        individspesifikke: Record<string, { beskrivelse: string }>;
        husholdsspesifikke: Record<string, { beskrivelse: string }>;
    };
};

export default function LivingExpenses() {
    // sensible defaults for living costs (one category only)
    const defaults = [
        'Dagligvarer',
        'Transport',
        'Mobilabonnement',
        'Underholdning',
    ];
    const livingCosts = useStore((s: StoreState) => s.data.livingCosts);
    const setData = useStore((s: StoreState) => s.setData);
    const addLivingCostAction = useStore((s: StoreState) => s.addLivingCost);
    const updateLivingCost = useStore((s: StoreState) => s.updateLivingCost);
    const deleteLivingCost = useStore((s: StoreState) => s.deleteLivingCost);
    const hasHydrated = useStore((s) => s._hasHydrated);

    const [autoDialogOpen, setAutoDialogOpen] = useState(false);
    const [autoLoading, setAutoLoading] = useState(false);
    const [autoError, setAutoError] = useState<string | null>(null);
    const [autoForm, setAutoForm] = useState<AutoFormState>({
        select_year: '2025',
        inntekt: '0',
        antall_biler: '0',
        antall_elbiler: '0',
        kjonn0: 'm',
        alder0: '30',
        barnehage0: '0',
        sfo0: '0',
        sfogratis0: '0',
        gravid0: '0',
        student0: '0',
        pensjonist0: '0',
        lang: 'no',
    });

    useEffect(() => {
        if (!hasHydrated) return; // ⛔ wait for localStorage to be ready

        if (!livingCosts || livingCosts.length === 0) {
            const seeded: LivingCost[] = defaults.map((d) => ({
                description: d,
                amount: 0,
            }));
            setData((prev) => ({ ...prev, livingCosts: seeded }));
        }
    });

    function addLivingCost() {
        addLivingCostAction({ description: '', amount: 0 });
    }

    const autoGenerateLivingCosts = useMemo(
        () => async () => {
            setAutoError(null);
            setAutoLoading(true);

            const normalizeNumberInput = (value: string) => {
                const parsed = Number(value);

                if (!Number.isFinite(parsed) || parsed < 0) {
                    return '0';
                }

                return Math.trunc(parsed).toString();
            };

            const normalizedForm: AutoFormState = {
                ...autoForm,
                inntekt: normalizeNumberInput(autoForm.inntekt),
                antall_biler: normalizeNumberInput(autoForm.antall_biler),
                antall_elbiler: normalizeNumberInput(autoForm.antall_elbiler),
                alder0: normalizeNumberInput(autoForm.alder0),
                barnehage0: normalizeNumberInput(autoForm.barnehage0),
                sfo0: normalizeNumberInput(autoForm.sfo0),
                sfogratis0: normalizeNumberInput(autoForm.sfogratis0),
                gravid0: normalizeNumberInput(autoForm.gravid0),
                student0: normalizeNumberInput(autoForm.student0),
                pensjonist0: normalizeNumberInput(autoForm.pensjonist0),
                // The API expects "lang=no"; other variants trigger PHP notices
                lang: 'no',
            };

            try {
                const response = await fetch('/api/sifo', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(normalizedForm),
                });

                if (!response.ok) {
                    const payload = (await response
                        .json()
                        .catch(() => null)) as { error?: string } | null;

                    throw new Error(
                        payload?.error ??
                            'Klarte ikke å hente levekostnader fra serveren'
                    );
                }

                const data = (await response.json()) as BudgetResponse;

                const buildCosts = (
                    amounts: Record<string, number>,
                    descriptions: Record<string, { beskrivelse: string }>
                ) =>
                    Object.entries(amounts)
                        .filter(([, value]) => typeof value === 'number')
                        .map(([key, value]) => ({
                            description: descriptions[key]?.beskrivelse ?? key,
                            amount: value,
                        }));

                const livingCostItems: LivingCost[] = [
                    ...buildCosts(
                        data.utgifter.individspesifikke,
                        data.utgifterBeskrivelser.individspesifikke
                    ),
                    ...buildCosts(
                        data.utgifter.husholdsspesifikke,
                        data.utgifterBeskrivelser.husholdsspesifikke
                    ),
                ];

                setData((prev) => ({
                    ...prev,
                    livingCosts: livingCostItems,
                }));
                setAutoDialogOpen(false);
            } catch (error) {
                setAutoError(
                    error instanceof Error
                        ? error.message
                        : 'Ukjent feil ved henting av budsjett'
                );
            } finally {
                setAutoLoading(false);
            }
        },
        [autoForm, setData]
    );

    const handleAutoFormChange = (key: keyof AutoFormState, value: string) => {
        setAutoForm((prev) => ({ ...prev, [key]: value }));
    };

    const totalLivingCosts = livingCosts.reduce(
        (total, item) => total + item.amount,
        0
    );

    return (
        <section className='w-full my-8'>
            <TypographyH2>Levekostnader</TypographyH2>
            <TypographyP>
                Legg inn løpende levekostnader her. Første kolonne er en
                beskrivelse, og beløp kan endres direkte. Du kan hente forslag
                fra referansebudsjettet til{' '}
                <Link
                    href='https://www.oslomet.no/om/sifo/referansebudsjettet'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='underline hover:text-foreground'
                >
                    SIFO
                </Link>{' '}
                via knappen under tabellen og bruke de som et utgangspunkt for
                dine egne kostnader.
            </TypographyP>

            <Dialog open={autoDialogOpen} onOpenChange={setAutoDialogOpen}>
                <DialogTrigger asChild>
                    <Button className=' w-full mb-4'>
                        Autogenerer levekostnader <Cog />
                    </Button>
                </DialogTrigger>
                <DialogContent className='sm:max-w-lg'>
                    <DialogHeader>
                        <DialogTitle>
                            Hent forslag fra referansebudsjett
                        </DialogTitle>
                        <DialogDescription>
                            Velg alder, kjønn og eventuelle tilpasninger for
                            husholdningen. Tallene er hentet fra SIFOs
                            referansebudsjett.
                        </DialogDescription>
                    </DialogHeader>

                    <div className='grid gap-4 py-4'>
                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-1'>
                                <Label htmlFor='select_year'>År</Label>
                                <NativeSelect
                                    id='select_year'
                                    value={autoForm.select_year}
                                    onChange={(e) =>
                                        handleAutoFormChange(
                                            'select_year',
                                            e.target.value
                                        )
                                    }
                                >
                                    <NativeSelectOption value='2025'>
                                        2025
                                    </NativeSelectOption>
                                    <NativeSelectOption value='2024'>
                                        2024
                                    </NativeSelectOption>
                                </NativeSelect>
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-1'>
                                <Label htmlFor='kjonn0'>Kjønn</Label>
                                <NativeSelect
                                    id='kjonn0'
                                    value={autoForm.kjonn0}
                                    onChange={(e) =>
                                        handleAutoFormChange(
                                            'kjonn0',
                                            e.target.value as 'm' | 'k'
                                        )
                                    }
                                >
                                    <NativeSelectOption value='m'>
                                        Mann
                                    </NativeSelectOption>
                                    <NativeSelectOption value='k'>
                                        Kvinne
                                    </NativeSelectOption>
                                </NativeSelect>
                            </div>
                            <div className='space-y-1'>
                                <Label htmlFor='alder0'>Alder</Label>
                                <Input
                                    id='alder0'
                                    type='number'
                                    inputMode='numeric'
                                    value={autoForm.alder0}
                                    onChange={(e) =>
                                        handleAutoFormChange(
                                            'alder0',
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-1'>
                                <Label htmlFor='student0'>Student</Label>
                                <NativeSelect
                                    id='student0'
                                    value={autoForm.student0}
                                    onChange={(e) =>
                                        handleAutoFormChange(
                                            'student0',
                                            e.target.value
                                        )
                                    }
                                >
                                    <NativeSelectOption value='0'>
                                        Nei
                                    </NativeSelectOption>
                                    <NativeSelectOption value='1'>
                                        Ja
                                    </NativeSelectOption>
                                </NativeSelect>
                            </div>
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                            <div className='space-y-1'>
                                <Label htmlFor='antall_biler'>
                                    Antall fossilbiler
                                </Label>
                                <Input
                                    id='antall_biler'
                                    type='number'
                                    inputMode='numeric'
                                    value={autoForm.antall_biler}
                                    onChange={(e) =>
                                        handleAutoFormChange(
                                            'antall_biler',
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                            <div className='space-y-1'>
                                <Label htmlFor='antall_elbiler'>
                                    Antall elbiler
                                </Label>
                                <Input
                                    id='antall_elbiler'
                                    type='number'
                                    inputMode='numeric'
                                    value={autoForm.antall_elbiler}
                                    onChange={(e) =>
                                        handleAutoFormChange(
                                            'antall_elbiler',
                                            e.target.value
                                        )
                                    }
                                />
                            </div>
                        </div>

                        {autoError && (
                            <p className='text-sm text-destructive'>
                                {autoError}
                            </p>
                        )}
                    </div>

                    <DialogFooter className='sm:justify-start gap-2'>
                        <DialogClose asChild>
                            <Button type='button' variant='secondary'>
                                Avbryt
                            </Button>
                        </DialogClose>
                        <Button
                            type='button'
                            onClick={autoGenerateLivingCosts}
                            disabled={autoLoading}
                        >
                            {autoLoading
                                ? 'Henter forslag...'
                                : 'Beregn levekostnader'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className='overflow-auto rounded-md border'>
                <table className='w-full table-fixed'>
                    <thead>
                        <tr className='bg-muted text-sm'>
                            <th className='p-2 text-left w-3/4'>Beskrivelse</th>
                            <th className='p-2 text-left w-1/4'>Beløp (kr)</th>
                            <th className='w-12'> </th>
                        </tr>
                    </thead>
                    <tbody>
                        {livingCosts.map((item, index) => (
                            <tr
                                key={index}
                                className='odd:bg-background even:bg-muted/5'
                            >
                                <td className='p-2 pb-0'>
                                    <Input
                                        id={`living-description-${index}`}
                                        type='text'
                                        value={item.description}
                                        placeholder='Dagligvarer'
                                        onChange={(e) =>
                                            updateLivingCost(index, {
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </td>
                                <td className='p-2 pb-0 pr-0 pl-0'>
                                    <Input
                                        id={`living-amount-${index}`}
                                        type='number'
                                        value={item.amount}
                                        onChange={(e) =>
                                            updateLivingCost(index, {
                                                amount: Number(
                                                    e.target.value || 0
                                                ),
                                            })
                                        }
                                    />
                                </td>
                                <td className='p-2 text-center pr-0 pl-0 pb-0'>
                                    <Button
                                        variant='ghost'
                                        className=' text-destructive border-destructive hover:bg-destructive/10 hover:border-destructive hover:text-destructive'
                                        size='icon'
                                        onClick={() => deleteLivingCost(index)}
                                    >
                                        <Trash />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td className='p-2 pb-0'> </td>
                            <td className='p-2 pb-0'> </td>
                            <td className='p-2 pb-0'> </td>
                        </tr>
                        <tr className='border-t font-semibold text-sm'>
                            <td className='p-2 pl-4 '>Totalt</td>
                            <td className='p-2 pl-4 ' colSpan={2}>
                                {totalLivingCosts.toLocaleString()} kr / mnd
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <Button
                variant='outline'
                className='w-full mt-2'
                onClick={addLivingCost}
            >
                + Legg til kostnad
            </Button>
        </section>
    );
}
