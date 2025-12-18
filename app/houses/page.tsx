'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useStore, { StoreState } from '@/lib/store';
import type { HouseOption, HouseMonthlyCosts, Loan } from '@/types';
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
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
} from '@/components/ui/card';
import { Datepicker } from '@/components/Datepicker';
import {
    Trash,
    Plus,
    Check,
    Loader2,
    Sparkles,
    Link2,
    Info,
    Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { autoFetchHouseData } from './fetchHousedata';

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
            // setHouseOption(house) or add to store
            addHouse({
                ...house,
                purchase: {
                    ...house.purchase,
                    equityUsed: personalEquity || 0,
                },
                housingLoan: {
                    ...house.housingLoan,
                    loanAmount:
                        (house.purchase.price || 0) -
                        (personalEquity || 0) +
                        (house.purchase.closingCosts || 0),
                },
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
    });

    function openAddDialog() {
        setForm({
            name: '',
            price: 0,
            equityUsed: personalEquity || 0,
            expectedGrowthPct: 2,
            closingCosts: 0,
        });
        setDialogOpen(true);
    }

    function submitAdd() {
        const loanAmount = form.price - form.equityUsed + form.closingCosts;

        if (form.equityUsed > form.price + form.closingCosts) {
            setForm((prev) => ({
                ...prev,
                equityUsed: form.price + form.closingCosts,
            }));
            return;
        }

        addHouse({
            name: form.name || 'Ny bolig',
            purchase: {
                price: form.price,
                equityUsed: form.equityUsed,
                expectedGrowthPct: form.expectedGrowthPct,
                closingCosts: form.closingCosts,
            },
            housingLoan: {
                description: 'Boliglån',
                loanAmount: loanAmount > 0 ? loanAmount : 0,
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

        // Auto-calculate loan amount when price/equity/closingCosts change
        if (
            field === 'price' ||
            field === 'equityUsed' ||
            field === 'closingCosts'
        ) {
            const loanAmount =
                newPurchase.price -
                newPurchase.equityUsed +
                (newPurchase.closingCosts || 0);
            updateHouseLoan(houseId, {
                loanAmount: loanAmount > 0 ? loanAmount : 0,
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

    function getTotalMonthlyCosts(costs: HouseMonthlyCosts): number {
        return (
            (costs.hoa || 0) +
            (costs.electricity || 0) +
            (costs.internet || 0) +
            (costs.insurance || 0) +
            (costs.propertyTax || 0) +
            (costs.maintenance || 0) +
            (costs.other || 0)
        );
    }

    return (
        <main className='container mx-auto px-4 py-8'>
            <TypographyH2>Sammenlign boliger</TypographyH2>
            <TypographyP>
                Her kan du legge til ulike boligalternativer for å sammenligne
                dem. Velg den aktive boligen for å bruke den i beregninger.
            </TypographyP>

            {/* Personal Equity */}
            <Card className='overflow-hidden border-muted/60 gap-2'>
                <CardHeader>
                    <div className='flex items-center gap-2'>
                        <div className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-brandBlue/90 p-2 text-brandOrange'>
                            <Coins className='h-4 w-4' />
                        </div>
                        <h3 className='font-semibold leading-none'>
                            Din personlige egenkapital
                        </h3>
                    </div>
                </CardHeader>
                <CardContent className='pt-0'>
                    <Input
                        id='personalEquity'
                        type='number'
                        className='w-48'
                        value={personalEquity || ''}
                        onChange={(e) =>
                            setPersonalEquity(Number(e.target.value) || 0)
                        }
                    />
                    <span className='text-muted-foreground text-sm ml-2'>
                        kr
                    </span>

                    <p className='text-sm text-muted-foreground mt-2'>
                        Din totale egenkapital som kan kan benyttes til
                        boligkjøp.
                    </p>
                </CardContent>
            </Card>

            <div className='my-6'>
                <Card className='overflow-hidden border-muted/60 gap-4'>
                    <CardHeader>
                        <div className='flex items-start justify-between gap-4'>
                            <div className='space-y-1'>
                                <div className='flex items-center gap-2'>
                                    <div className='inline-flex h-8 w-8 items-center justify-center rounded-full bg-brandBlue/90 p-2 text-brandOrange'>
                                        <Sparkles className='h-4 w-4' />
                                    </div>
                                    <h3 className='font-semibold leading-none'>
                                        Legg til bolig automatisk
                                    </h3>
                                </div>
                                <p className='text-sm text-muted-foreground'>
                                    Lim inn en FINN-lenke, så forsøkes det å
                                    hente pris, felleskostnader og andre
                                    relevante felter.
                                </p>
                            </div>

                            <span className='hidden sm:inline-flex rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground'>
                                Beta
                            </span>
                        </div>
                    </CardHeader>

                    <CardContent className='pt-0'>
                        <div className='space-y-2'>
                            <Label
                                htmlFor='finnLink'
                                className='text-xs text-muted-foreground'
                            >
                                FINN-lenke
                            </Label>

                            <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
                                <div
                                    className={cn(
                                        'relative flex-1',
                                        finnError && 'animate-in'
                                    )}
                                >
                                    <Link2 className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                                    <Input
                                        id='finnLink'
                                        type='url'
                                        inputMode='url'
                                        value={finnURL}
                                        onChange={(e) => {
                                            setFinnURL(e.target.value);
                                            setFinnError(null);
                                        }}
                                        className={cn(
                                            'h-11 pl-9 pr-3',
                                            'bg-background/60',
                                            'focus-visible:ring-2 focus-visible:ring-primary/30',
                                            finnURL &&
                                                !canFetchFinn &&
                                                'border-destructive/60 focus-visible:ring-destructive/30'
                                        )}
                                    />
                                </div>

                                <Button
                                    className='h-11 gap-2'
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

                            {/* Helper / error text */}
                            {finnURL && !canFetchFinn && !finnError && (
                                <p className='text-xs text-destructive/90'>
                                    Lim inn en gyldig FINN-lenke (må inneholde
                                    finn.no).
                                </p>
                            )}

                            {finnError ? (
                                <div className='rounded-md border border-destructive/30 bg-destructive/5 p-3'>
                                    <p className='text-sm text-destructive'>
                                        {finnError}
                                    </p>
                                </div>
                            ) : (
                                <div className='flex items-start gap-2 text-xs text-muted-foreground'>
                                    <Info className='mt-0.5 h-4 w-4' />
                                    <p className='mt-0.5'>
                                        Tips: Etter import kan du alltid justere
                                        tallene manuelt før du sammenligner.
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* House Cards */}
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 my-6'>
                {houses.map((house) => (
                    <Card
                        key={house.id}
                        className={cn(
                            'relative transition-all',
                            house.id === activeHouseId &&
                                'ring-2 ring-primary border-primary'
                        )}
                    >
                        <CardHeader className='pb-2'>
                            <div className='flex items-center justify-between'>
                                <Input
                                    className='text-lg font-semibold border-none px-0 h-auto focus-visible:ring-0 rounded-none'
                                    value={house.name}
                                    onChange={(e) =>
                                        updateHouse(house.id, {
                                            name: e.target.value,
                                        })
                                    }
                                />
                                {house.id === activeHouseId ? (
                                    <span className='text-xs bg-primary text-primary-foreground ml-4 px-2 py-1 rounded'>
                                        Aktiv
                                    </span>
                                ) : (
                                    <Button
                                        variant='outline'
                                        size='sm'
                                        className='ml-4 text-xs px-2 py-0 rounded'
                                        onClick={() =>
                                            setActiveHouseId(house.id)
                                        }
                                    >
                                        Velg
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent className='space-y-4'>
                            {/* Purchase Details */}
                            <div>
                                <h4 className='font-medium mb-2 text-sm text-muted-foreground'>
                                    Kjøpsdetaljer
                                </h4>
                                <div className='grid grid-cols-2 gap-2'>
                                    <div>
                                        <Label className='text-xs'>
                                            Prisantydning
                                        </Label>
                                        <Input
                                            type='number'
                                            value={house.purchase.price || ''}
                                            onChange={(e) =>
                                                handlePurchaseChange(
                                                    house.id,
                                                    house,
                                                    'price',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>

                                    <div>
                                        <Label className='text-xs'>
                                            Omkostninger + gjeld
                                        </Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.purchase.closingCosts ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                handlePurchaseChange(
                                                    house.id,
                                                    house,
                                                    'closingCosts',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className='text-xs'>
                                            Egenkapital brukt
                                        </Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.purchase.equityUsed || ''
                                            }
                                            onChange={(e) =>
                                                handlePurchaseChange(
                                                    house.id,
                                                    house,
                                                    'equityUsed',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className='text-xs'>
                                            Forventet priskvekst %
                                        </Label>
                                        <Input
                                            type='number'
                                            step='0.1'
                                            value={
                                                house.purchase
                                                    .expectedGrowthPct ?? ''
                                            }
                                            onChange={(e) =>
                                                handlePurchaseChange(
                                                    house.id,
                                                    house,
                                                    'expectedGrowthPct',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                                <div className='mt-2 text-sm text-muted-foreground'>
                                    Totalpris:{' '}
                                    {(
                                        (house.purchase.price || 0) +
                                        (house.purchase.closingCosts || 0)
                                    ).toLocaleString('nb-NO')}{' '}
                                    kr
                                </div>
                            </div>

                            {/* Loan Details */}
                            <div>
                                <h4 className='font-medium mb-2 text-sm text-muted-foreground'>
                                    Lån
                                </h4>
                                <div className='grid grid-cols-2 gap-2'>
                                    <div>
                                        <Label className='text-xs'>
                                            Lånebeløp
                                        </Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.housingLoan.loanAmount ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                handleLoanChange(
                                                    house.id,
                                                    'loanAmount',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className='text-xs'>
                                            Nominell rente %
                                        </Label>
                                        <Input
                                            type='number'
                                            step='0.01'
                                            value={
                                                house.housingLoan
                                                    .interestRate || ''
                                            }
                                            onChange={(e) =>
                                                handleLoanChange(
                                                    house.id,
                                                    'interestRate',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className='text-xs'>
                                            Nedbet. år
                                        </Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.housingLoan.termYears ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                handleLoanChange(
                                                    house.id,
                                                    'termYears',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className='text-xs'>
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
                                    <div>
                                        <Label className='text-xs'>
                                            Terminer per år
                                        </Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.housingLoan
                                                    .termsPerYear || ''
                                            }
                                            onChange={(e) =>
                                                handleLoanChange(
                                                    house.id,
                                                    'termsPerYear',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className='text-xs'>
                                            Månedlig gebyr
                                        </Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.housingLoan.monthlyFee ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                handleLoanChange(
                                                    house.id,
                                                    'monthlyFee',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Monthly Costs */}
                            <div>
                                <h4 className='font-medium mb-2 text-sm text-muted-foreground'>
                                    Månedlige kostnader (
                                    {getTotalMonthlyCosts(
                                        house.houseMonthlyCosts
                                    ).toLocaleString('nb-NO')}{' '}
                                    kr)
                                </h4>
                                <div className='grid grid-cols-2 gap-2'>
                                    <div>
                                        <Label className='text-xs'>
                                            Felleskost.
                                        </Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.houseMonthlyCosts.hoa ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                handleMonthlyCostChange(
                                                    house.id,
                                                    'hoa',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className='text-xs'>Strøm</Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.houseMonthlyCosts
                                                    .electricity || ''
                                            }
                                            onChange={(e) =>
                                                handleMonthlyCostChange(
                                                    house.id,
                                                    'electricity',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className='text-xs'>
                                            Internett
                                        </Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.houseMonthlyCosts
                                                    .internet || ''
                                            }
                                            onChange={(e) =>
                                                handleMonthlyCostChange(
                                                    house.id,
                                                    'internet',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className='text-xs'>
                                            Forsikring
                                        </Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.houseMonthlyCosts
                                                    .insurance || ''
                                            }
                                            onChange={(e) =>
                                                handleMonthlyCostChange(
                                                    house.id,
                                                    'insurance',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className='text-xs'>
                                            Eiendomsskatt
                                        </Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.houseMonthlyCosts
                                                    .propertyTax || ''
                                            }
                                            onChange={(e) =>
                                                handleMonthlyCostChange(
                                                    house.id,
                                                    'propertyTax',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div>
                                        <Label className='text-xs'>
                                            Vedlikehold
                                        </Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.houseMonthlyCosts
                                                    .maintenance || ''
                                            }
                                            onChange={(e) =>
                                                handleMonthlyCostChange(
                                                    house.id,
                                                    'maintenance',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                    <div className='col-span-2'>
                                        <Label className='text-xs'>Annet</Label>
                                        <Input
                                            type='number'
                                            value={
                                                house.houseMonthlyCosts.other ||
                                                ''
                                            }
                                            onChange={(e) =>
                                                handleMonthlyCostChange(
                                                    house.id,
                                                    'other',
                                                    Number(e.target.value) || 0
                                                )
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className='flex justify-between'>
                            {house.id !== activeHouseId ? (
                                <Button
                                    variant='outline'
                                    size='sm'
                                    onClick={() => setActiveHouseId(house.id)}
                                >
                                    <Check className='w-4 h-4 mr-1' />
                                    Velg
                                </Button>
                            ) : (
                                <span className='text-sm text-muted-foreground'>
                                    Brukes i beregninger
                                </span>
                            )}
                            <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => deleteHouse(house.id)}
                            >
                                <Trash className='w-4 h-4 text-destructive' />
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {/* Add New House Card */}
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Card
                            className='flex items-center justify-center min-h-[300px] border-dashed cursor-pointer hover:bg-muted/50 transition-colors'
                            onClick={openAddDialog}
                        >
                            <div className='text-center'>
                                <Plus className='w-12 h-12 mx-auto text-muted-foreground' />
                                <p className='mt-2 text-muted-foreground'>
                                    Legg til bolig manuelt
                                </p>
                            </div>
                        </Card>
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
                                <Input
                                    id='housePrice'
                                    type='number'
                                    value={form.price || ''}
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
                                    Omkostninger + gjeld
                                </Label>
                                <Input
                                    id='houseClosingCosts'
                                    type='number'
                                    value={form.closingCosts ?? ''}
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
                                <Label htmlFor='houseEquity' className='my-2'>
                                    Egenkapital å bruke
                                </Label>
                                <Input
                                    id='houseEquity'
                                    type='number'
                                    value={form.equityUsed || ''}
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
                                {(form.price -
                                    form.equityUsed +
                                    form.closingCosts >
                                0
                                    ? form.price -
                                      form.equityUsed +
                                      form.closingCosts
                                    : 0
                                ).toLocaleString('nb-NO')}{' '}
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
        </main>
    );
}
