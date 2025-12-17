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
import { Trash, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HousesPage() {
    const houses = useStore((s: StoreState) => s.data.houses);
    const activeHouseId = useStore((s: StoreState) => s.data.activeHouseId);
    const personalEquity = useStore((s: StoreState) => s.data.personalEquity);
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
            <div className='my-6 p-4 border rounded-md bg-muted/30'>
                <div className='flex items-center gap-4'>
                    <Label htmlFor='personalEquity' className='font-semibold'>
                        Total egenkapital
                    </Label>
                    <Input
                        id='personalEquity'
                        type='number'
                        className='w-48'
                        value={personalEquity || ''}
                        onChange={(e) =>
                            setPersonalEquity(Number(e.target.value) || 0)
                        }
                    />
                    <span className='text-muted-foreground text-sm'>kr</span>
                </div>
                <p className='text-sm text-muted-foreground mt-2'>
                    Din totale egenkapital som kan brukes til boligkjøp.
                </p>
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
                                    Legg til bolig
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
