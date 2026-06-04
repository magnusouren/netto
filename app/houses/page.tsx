'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Label } from '@/components/ui/label';
import useStore, { StoreState } from '@/lib/store';
import type { HouseOption, HouseMonthlyCosts, Loan } from '@/types';
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
import { Datepicker } from '@/components/Datepicker';
import {
    Trash,
    Plus,
    Check,
    Loader2,
    Sparkles,
    Link2,
    Info,
    ArrowRight,
} from 'lucide-react';
import { cn, formatNumberToNOK } from '@/lib/utils';
import {
    computeHousingLoanAmount,
    totalPurchasePrice,
} from '@/lib/houseFinance';
import { autoFetchHouseData } from './fetchHousedata';
import Summary from '@/views/summary';
import { TypographyH1 } from '@/components/typography/typographyH1';
import { Glance } from '@/components/ledger/Glance';
import { Questionmark } from '@/components/Questionmark';

export default function HousesPage() {
    const houses = useStore((s: StoreState) => s.data.houses);
    const activeHouseId = useStore((s: StoreState) => s.data.activeHouseId);
    const personalEquity = useStore((s: StoreState) => s.data.personalEquity);
    const [finnURL, setFinnURL] = useState('');
    const [finnError, setFinnError] = useState<string | null>(null);
    const [isFetchingFinn, setIsFetchingFinn] = useState(false);
    const canFetchFinn = finnURL.includes('finn.no');

    const fetchFinnHouseData = async (url: string) => {
        setFinnError(null);
        if (!url.includes('finn.no')) {
            setFinnError('Vennligst lim inn en gyldig FINN-lenke.');
            return;
        }

        setIsFetchingFinn(true);
        try {
            const house = await autoFetchHouseData(url);
            const purchase = {
                ...house.purchase,
                equityUsed: personalEquity || 0,
            };
            addHouse({
                ...house,
                purchase,
                housingLoan: {
                    ...house.housingLoan,
                    loanAmount: computeHousingLoanAmount(purchase),
                },
                URL: url,
            });
            setFinnURL('');
        } catch (e) {
            setFinnError(
                'Kunne ikke hente boligdata. Vennligst prøv igjen senere.'
            );
            console.error('Feil ved henting av boligdata:', e);
        } finally {
            setIsFetchingFinn(false);
        }
    };

    const addHouse = useStore((s: StoreState) => s.addHouse);
    const updateHouse = useStore((s: StoreState) => s.updateHouse);
    const updateHouseLoan = useStore((s: StoreState) => s.updateHouseLoan);
    const updateHouseMonthlyCosts = useStore(
        (s: StoreState) => s.updateHouseMonthlyCosts
    );
    const deleteHouse = useStore((s: StoreState) => s.deleteHouse);
    const setActiveHouseId = useStore((s: StoreState) => s.setActiveHouseId);
    const setPersonalEquity = useStore((s: StoreState) => s.setPersonalEquity);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({
        name: '',
        price: 0,
        equityUsed: 0,
        expectedGrowthPct: 2,
        closingCosts: 0,
        commonDebt: 0,
    });

    function openAddDialog() {
        setForm({
            name: '',
            price: 0,
            equityUsed: personalEquity || 0,
            expectedGrowthPct: 2,
            closingCosts: 0,
            commonDebt: 0,
        });
        setDialogOpen(true);
    }

    function submitAdd() {
        if (form.equityUsed > form.price + form.closingCosts) {
            setForm((prev) => ({
                ...prev,
                equityUsed: form.price + form.closingCosts,
            }));
            return;
        }

        const purchase = {
            price: form.price,
            equityUsed: form.equityUsed,
            expectedGrowthPct: form.expectedGrowthPct,
            closingCosts: form.closingCosts,
            commonDebt: form.commonDebt,
        };

        addHouse({
            name: form.name || 'Ny bolig',
            purchase,
            housingLoan: {
                description: 'Boliglån',
                loanAmount: computeHousingLoanAmount(purchase),
                interestRate: 4.5,
                termYears: 25,
                termsPerYear: 12,
                startDate: new Date().toISOString().slice(0, 10),
            },
        });
        setDialogOpen(false);
    }

    function handlePurchaseChange(
        houseId: string,
        house: HouseOption,
        field: keyof HouseOption['purchase'],
        value: number
    ) {
        const newPurchase = { ...house.purchase, [field]: value };
        updateHouse(houseId, { purchase: newPurchase });

        if (
            field === 'price' ||
            field === 'equityUsed' ||
            field === 'closingCosts'
        ) {
            updateHouseLoan(houseId, {
                loanAmount: computeHousingLoanAmount(newPurchase),
            });
        }
    }

    function handleLoanChange(
        houseId: string,
        field: keyof Loan,
        value: number | string
    ) {
        updateHouseLoan(houseId, { [field]: value });
    }

    function handleMonthlyCostChange(
        houseId: string,
        field: keyof HouseMonthlyCosts,
        value: number
    ) {
        updateHouseMonthlyCosts(houseId, { [field]: value });
    }

    return (
        <main className='container my-8 min-h-24'>
            <TypographyH1>Boliger</TypographyH1>
            <TypographyP>
                Her kan du legge til ulike boligalternativer for å sammenligne
                dem. Den valgte boligen brukes i beregningene du finner på de andre sidene.
            </TypographyP>

            {houses.length >= 2 && (
                <div className='mt-2'>
                    <Link
                        href='/sammenligning'
                        className='inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
                    >
                        Sammenlign boligene side ved side
                        <ArrowRight className='h-3.5 w-3.5' />
                    </Link>
                </div>
            )}

            {/* Personal Equity */}
            <div className='my-6'>
                <Glance
                    density='compact'
                    title={
                        <span className='inline-flex items-center gap-1.5'>
                            Personlig egenkapital
                            <Questionmark helptext='Total egenkapital tilgjengelig for boligkjøp. Brukes som forslag når du legger til en ny bolig.' />
                        </span>
                    }
                    subtitle='Tilgjengelig for boligkjøp'
                    indexLabel={formatNumberToNOK(personalEquity || 0)}
                >
                    <div className='py-3 grid grid-cols-[1fr_auto] gap-3 items-center'>
                        <NumericInput
                            id='personalEquity'
                            className='font-mono'
                            value={personalEquity}
                            onChange={(e) =>
                                setPersonalEquity(Number(e.target.value) || 0)
                            }
                        />
                        <span className='text-xs text-muted-foreground'>
                            kr
                        </span>
                    </div>
                </Glance>
            </div>

            {/* FINN auto-fetch */}
            <div className='my-6'>
                <Glance
                    density='compact'
                    title={
                        <span className='inline-flex items-center gap-1.5'>
                            Legg til bolig automatisk
                            <Questionmark helptext='Lim inn en FINN-lenke for å hente pris, felleskostnader og andre nøkkeltall automatisk.' />
                        </span>
                    }
                    subtitle='Fra FINN-lenke'
                    indexLabel='Beta'
                >
                    <div className='py-3 space-y-2'>
                        <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                            <div className='relative flex-1'>
                                <Link2 className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                                <Input
                                    id='finnLink'
                                    type='url'
                                    inputMode='url'
                                    placeholder='https://www.finn.no/...'
                                    value={finnURL}
                                    onChange={(e) => {
                                        setFinnURL(e.target.value);
                                        setFinnError(null);
                                    }}
                                    className={cn(
                                        'h-10 pl-9 pr-3',
                                        finnURL &&
                                        !canFetchFinn &&
                                        'border-destructive/60 focus-visible:ring-destructive/30'
                                    )}
                                />
                            </div>

                            <Button
                                className='h-10 gap-2'
                                onClick={() => fetchFinnHouseData(finnURL)}
                                disabled={!canFetchFinn || isFetchingFinn}
                            >
                                {isFetchingFinn ? (
                                    <>
                                        <Loader2 className='h-4 w-4 animate-spin' />
                                        Henter…
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className='h-4 w-4' />
                                        Hent data
                                    </>
                                )}
                            </Button>
                        </div>

                        {finnURL && !canFetchFinn && !finnError && (
                            <p className='text-xs text-destructive/90'>
                                Lim inn en gyldig FINN-lenke (må inneholde
                                finn.no).
                            </p>
                        )}

                        {finnError ? (
                            <div className='border border-destructive/30 bg-destructive/5 p-3'>
                                <p className='text-sm text-destructive'>
                                    {finnError}
                                </p>
                            </div>
                        ) : (
                            <div className='flex items-start gap-2 text-xs text-muted-foreground'>
                                <Info className='mt-0.5 h-3.5 w-3.5' />
                                <p>
                                    Tips: Etter import kan du alltid justere
                                    tallene manuelt før du sammenligner.
                                </p>
                            </div>
                        )}
                    </div>
                </Glance>
            </div>

            {/* House Cards */}
            <div className='grid gap-6 md:grid-cols-2 2xl:grid-cols-3 my-6'>
                {houses.map((house) => {
                    const isActive = house.id === activeHouseId;
                    const totalPrice = totalPurchasePrice(house.purchase);

                    return (
                        <Glance
                            key={house.id}
                            density='compact'
                            className={cn(
                                isActive && 'ring-2 ring-primary'
                            )}
                            title={
                                <Input
                                    className='font-serif text-xl border-none px-0 h-auto focus-visible:ring-0 rounded-none bg-transparent shadow-none'
                                    value={house.name}
                                    onChange={(e) =>
                                        updateHouse(house.id, {
                                            name: e.target.value,
                                        })
                                    }
                                />
                            }
                            subtitle='Bolig & boliglån'
                            indexLabel={
                                isActive ? (
                                    'Aktiv'
                                ) : (
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setActiveHouseId(house.id)
                                        }
                                        className='inline-flex items-center gap-1.5 px-2.5 py-1 border border-foreground/40 text-foreground hover:bg-foreground hover:text-background hover:border-foreground transition-colors cursor-pointer'
                                    >
                                        Velg
                                    </button>
                                )
                            }
                            footnote={
                                <>
                                    <span>Totalpris</span>
                                    <span className='font-mono tabular-nums'>
                                        {formatNumberToNOK(totalPrice)}
                                    </span>
                                </>
                            }
                        >
                            <Glance.Section>Kjøpsdetaljer</Glance.Section>
                            <div className='grid grid-cols-2 gap-2 py-2'>
                                <NumericField
                                    label='Prisantydning'
                                    value={house.purchase.price}
                                    onChange={(v) =>
                                        handlePurchaseChange(
                                            house.id,
                                            house,
                                            'price',
                                            v
                                        )
                                    }
                                />
                                <NumericField
                                    label='Omkostninger'
                                    value={house.purchase.closingCosts || 0}
                                    onChange={(v) =>
                                        handlePurchaseChange(
                                            house.id,
                                            house,
                                            'closingCosts',
                                            v
                                        )
                                    }
                                />
                                <NumericField
                                    label='Fellesgjeld'
                                    value={house.purchase.commonDebt || 0}
                                    onChange={(v) =>
                                        handlePurchaseChange(
                                            house.id,
                                            house,
                                            'commonDebt',
                                            v
                                        )
                                    }
                                />
                                <NumericField
                                    label='Egenkapital brukt'
                                    value={house.purchase.equityUsed}
                                    onChange={(v) =>
                                        handlePurchaseChange(
                                            house.id,
                                            house,
                                            'equityUsed',
                                            v
                                        )
                                    }
                                />
                                <div className='col-span-2'>
                                    <ReadonlyField
                                        label='Totalpris'
                                        value={formatNumberToNOK(totalPrice)}
                                    />
                                </div>
                            </div>

                            <Glance.Section>Lån</Glance.Section>
                            <div className='grid grid-cols-2 gap-2 py-2'>
                                <NumericField
                                    label='Lånebeløp'
                                    value={house.housingLoan.loanAmount}
                                    onChange={(v) =>
                                        handleLoanChange(
                                            house.id,
                                            'loanAmount',
                                            v
                                        )
                                    }
                                />
                                <NumericField
                                    label='Nominell rente %'
                                    step='0.01'
                                    value={house.housingLoan.interestRate}
                                    onChange={(v) =>
                                        handleLoanChange(
                                            house.id,
                                            'interestRate',
                                            v
                                        )
                                    }
                                />
                                <NumericField
                                    label='Nedbet. år'
                                    value={house.housingLoan.termYears}
                                    onChange={(v) =>
                                        handleLoanChange(
                                            house.id,
                                            'termYears',
                                            v
                                        )
                                    }
                                />
                                <div className='space-y-1'>
                                    <Label className='text-[10px] uppercase tracking-wider text-muted-foreground'>
                                        Startdato
                                    </Label>
                                    <Datepicker
                                        label=''
                                        dateValue={
                                            house.housingLoan.startDate
                                                ? new Date(
                                                    house.housingLoan.startDate
                                                )
                                                : undefined
                                        }
                                        setDateValue={(date) =>
                                            handleLoanChange(
                                                house.id,
                                                'startDate',
                                                date
                                                    ?.toISOString()
                                                    .slice(0, 10) || ''
                                            )
                                        }
                                    />
                                </div>
                                <NumericField
                                    label='Terminer per år'
                                    value={house.housingLoan.termsPerYear}
                                    onChange={(v) =>
                                        handleLoanChange(
                                            house.id,
                                            'termsPerYear',
                                            v
                                        )
                                    }
                                />
                                <NumericField
                                    label='Månedlig gebyr'
                                    value={house.housingLoan.monthlyFee || 0}
                                    onChange={(v) =>
                                        handleLoanChange(
                                            house.id,
                                            'monthlyFee',
                                            v
                                        )
                                    }
                                />
                            </div>

                            <Glance.Section>Månedlige kostnader</Glance.Section>
                            <div className='grid grid-cols-2 gap-2 py-2'>
                                <NumericField
                                    label='Felleskost.'
                                    value={house.houseMonthlyCosts.hoa || 0}
                                    onChange={(v) =>
                                        handleMonthlyCostChange(
                                            house.id,
                                            'hoa',
                                            v
                                        )
                                    }
                                />
                                <NumericField
                                    label='Strøm'
                                    value={
                                        house.houseMonthlyCosts.electricity ||
                                        0
                                    }
                                    onChange={(v) =>
                                        handleMonthlyCostChange(
                                            house.id,
                                            'electricity',
                                            v
                                        )
                                    }
                                />
                                <NumericField
                                    label='Internett'
                                    value={
                                        house.houseMonthlyCosts.internet || 0
                                    }
                                    onChange={(v) =>
                                        handleMonthlyCostChange(
                                            house.id,
                                            'internet',
                                            v
                                        )
                                    }
                                />
                                <NumericField
                                    label='Forsikring'
                                    value={
                                        house.houseMonthlyCosts.insurance || 0
                                    }
                                    onChange={(v) =>
                                        handleMonthlyCostChange(
                                            house.id,
                                            'insurance',
                                            v
                                        )
                                    }
                                />
                                <NumericField
                                    label='Eiendomsskatt'
                                    value={
                                        house.houseMonthlyCosts.propertyTax ||
                                        0
                                    }
                                    onChange={(v) =>
                                        handleMonthlyCostChange(
                                            house.id,
                                            'propertyTax',
                                            v
                                        )
                                    }
                                />
                                <NumericField
                                    label='Vedlikehold'
                                    value={
                                        house.houseMonthlyCosts.maintenance ||
                                        0
                                    }
                                    onChange={(v) =>
                                        handleMonthlyCostChange(
                                            house.id,
                                            'maintenance',
                                            v
                                        )
                                    }
                                />
                                <div className='col-span-2'>
                                    <NumericField
                                        label='Annet'
                                        value={
                                            house.houseMonthlyCosts.other || 0
                                        }
                                        onChange={(v) =>
                                            handleMonthlyCostChange(
                                                house.id,
                                                'other',
                                                v
                                            )
                                        }
                                    />
                                </div>
                            </div>

                            <Glance.Section>Verdiutvikling</Glance.Section>
                            <div className='py-2'>
                                <NumericField
                                    label='Forventet prisvekst %'
                                    step='0.1'
                                    value={
                                        house.purchase.expectedGrowthPct ?? 0
                                    }
                                    onChange={(v) =>
                                        handlePurchaseChange(
                                            house.id,
                                            house,
                                            'expectedGrowthPct',
                                            v
                                        )
                                    }
                                />
                            </div>

                            {house.URL && (
                                <>
                                    <Glance.Section>Kilde</Glance.Section>
                                    <a
                                        href={house.URL}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='block py-1 break-all text-xs text-primary hover:underline'
                                    >
                                        {house.URL}
                                    </a>
                                </>
                            )}

                            <div className='flex items-center justify-between pt-3 mt-2 border-t border-border/60'>
                                {!isActive ? (
                                    <button
                                        type='button'
                                        onClick={() =>
                                            setActiveHouseId(house.id)
                                        }
                                        className='inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer'
                                    >
                                        <Check className='h-3.5 w-3.5' /> Velg som aktiv
                                    </button>
                                ) : (
                                    <span className='text-xs text-muted-foreground'>
                                        Brukes i beregninger
                                    </span>
                                )}
                                <button
                                    type='button'
                                    onClick={() => deleteHouse(house.id)}
                                    className='inline-flex items-center gap-1.5 text-xs text-destructive hover:text-destructive/80 transition-colors cursor-pointer'
                                >
                                    <Trash className='h-3.5 w-3.5' /> Slett
                                </button>
                            </div>
                        </Glance>
                    );
                })}

                {/* Add New House Card */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <button
                            type='button'
                            onClick={openAddDialog}
                            className='min-h-[300px] flex flex-col items-center justify-center gap-3 border border-dashed border-border text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer'
                        >
                            <Plus className='w-10 h-10' />
                            <span className='text-sm'>
                                Legg til bolig manuelt
                            </span>
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Legg til ny bolig</DialogTitle>
                        </DialogHeader>
                        <div className='space-y-4 py-4'>
                            <div>
                                <Label htmlFor='houseName' className='my-2'>
                                    Tittel
                                </Label>
                                <Input
                                    id='houseName'
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor='housePrice' className='my-2'>
                                    Prisantydning
                                </Label>
                                <NumericInput
                                    id='housePrice'
                                    value={form.price}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            price: Number(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor='houseClosingCosts'
                                    className='my-2'
                                >
                                    Omkostninger
                                </Label>
                                <NumericInput
                                    id='houseClosingCosts'
                                    value={form.closingCosts ?? 0}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            closingCosts:
                                                Number(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label
                                    htmlFor='houseCommonDebt'
                                    className='my-2 inline-flex items-center gap-1.5'
                                >
                                    Fellesgjeld
                                    <Questionmark helptext='Fellesgjeld inngår ikke i ditt personlige boliglån — den betjenes via felleskostnader.' />
                                </Label>
                                <NumericInput
                                    id='houseCommonDebt'
                                    value={form.commonDebt ?? 0}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            commonDebt:
                                                Number(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor='houseEquity' className='my-2'>
                                    Egenkapital å bruke
                                </Label>
                                <NumericInput
                                    id='houseEquity'
                                    value={form.equityUsed}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            equityUsed:
                                                Number(e.target.value) || 0,
                                        })
                                    }
                                />
                            </div>

                            <p className='text-sm text-muted-foreground'>
                                Beregnet lån:{' '}
                                {computeHousingLoanAmount(form).toLocaleString(
                                    'nb-NO'
                                )}{' '}
                                kr
                            </p>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant='ghost'>Avbryt</Button>
                            </DialogClose>
                            <Button onClick={submitAdd}>Legg til</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Summary />
        </main>
    );
}

function NumericField({
    label,
    value,
    onChange,
    step,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    step?: string;
}) {
    return (
        <div className='space-y-1'>
            <Label className='text-[10px] uppercase tracking-wider text-muted-foreground'>
                {label}
            </Label>
            <NumericInput
                step={step}
                className='font-mono'
                value={value}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
            />
        </div>
    );
}

function ReadonlyField({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className='space-y-1'>
            <Label className='text-[10px] uppercase tracking-wider text-muted-foreground'>
                {label}
            </Label>
            <div className='h-9 px-3 py-1 flex items-center font-mono text-sm text-foreground/80 border border-input/60 rounded-md bg-muted/30'>
                {value}
            </div>
        </div>
    );
}

function NumericFieldWithHelp({
    label,
    helptext,
    value,
    onChange,
    step,
}: {
    label: string;
    helptext: string;
    value: number;
    onChange: (v: number) => void;
    step?: string;
}) {
    return (
        <div className='space-y-1'>
            <Label className='inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground'>
                {label}
                <Questionmark helptext={helptext} />
            </Label>
            <NumericInput
                step={step}
                className='font-mono'
                value={value}
                onChange={(e) => onChange(Number(e.target.value) || 0)}
            />
        </div>
    );
}
