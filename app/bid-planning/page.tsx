'use client';

import { useEffect, useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { NumericInput } from '@/components/ui/numeric-input';
import { Glance } from '@/components/ledger/Glance';
import { generatePaymentPlan } from '@/lib/monthlyPaymentPlan';
import useStore, { StoreState } from '@/lib/store';
import { cn, formatNumberToNOK } from '@/lib/utils';
import type { EconomyData, HouseOption } from '@/types';

const BID_STEP = 50_000;
const SCENARIO_DELTAS_KR = [-200_000, -50_000, 0, 50_000, 200_000];

type MonthlyShape = ReturnType<typeof generatePaymentPlan>[number];

type Simulation = {
    bidPrice: number;
    delta: number;
    loanAmount: number;
    monthOne: MonthlyShape;
    year1Interest: number;
};

function simulate(
    data: EconomyData,
    activeHouse: HouseOption,
    bidPrice: number,
    salaryAnnualGrowth: number,
    startDate: string
): Simulation {
    const delta = bidPrice - activeHouse.purchase.price;
    const newLoanAmount = Math.max(
        0,
        activeHouse.housingLoan.loanAmount + delta
    );

    const modifiedHouse: HouseOption = {
        ...activeHouse,
        purchase: { ...activeHouse.purchase, price: bidPrice },
        housingLoan: {
            ...activeHouse.housingLoan,
            loanAmount: newLoanAmount,
            startDate,
        },
    };

    // Anchor every existing loan's startDate to the simulation start so plan[0]
    // contains a row for each one. Without this, loans whose own startDate is
    // after `startDate` (e.g. a studielån booked later in time than the
    // housing loan's startDate) are dropped from month 1, understating
    // expenses. Termin is invariant to anchor; only the interest/principal
    // split shifts, which is acceptable for bid comparison.
    const modifiedData: EconomyData = {
        ...data,
        loans: (data.loans || []).map((l) => ({ ...l, startDate })),
        houses: (data.houses || []).map((h) =>
            h.id === activeHouse.id ? modifiedHouse : h
        ),
    };

    const plan = generatePaymentPlan(
        modifiedData,
        salaryAnnualGrowth,
        startDate,
        1
    );

    const year1Interest = plan
        .slice(0, 12)
        .reduce((sum, row) => sum + row.totalInterest, 0);

    return {
        bidPrice,
        delta,
        loanAmount: newLoanAmount,
        monthOne: plan[0],
        year1Interest,
    };
}

function formatSignedNOK(n: number): string {
    if (n === 0) return formatNumberToNOK(0);
    const sign = n > 0 ? '+ ' : '− ';
    return sign + formatNumberToNOK(Math.abs(n));
}

export default function BidPlanning() {
    const data = useStore((s: StoreState) => s.data);
    const activeHouse = useStore((s: StoreState) =>
        (s.data.houses || []).find((h) => h.id === s.data.activeHouseId)
    );

    const startDate = useMemo(() => {
        const loanStart = activeHouse?.housingLoan.startDate;
        if (loanStart) return loanStart;
        const d = new Date();
        d.setDate(1);
        return d.toISOString().slice(0, 10);
    }, [activeHouse?.housingLoan.startDate]);
    const salaryAnnualGrowth = 2;

    const listPrice = activeHouse?.purchase.price ?? 0;
    const [bid, setBid] = useState(listPrice);

    // Reset bid to list price when the active house changes (or first appears
    // after Zustand hydration). Without this, useState's initial value is
    // captured on the first render — before hydration — when listPrice is 0.
    useEffect(() => {
        if (activeHouse) setBid(activeHouse.purchase.price);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeHouse?.id]);

    if (!activeHouse) {
        return (
            <>
                <div className='container my-8 min-h-24'>
                    <TypographyH1>Budplanlegging</TypographyH1>
                    <TypographyP>
                        Velg en aktiv bolig under{' '}
                        <a href='/houses' className='underline'>
                            Boliger
                        </a>{' '}
                        for å simulere bud.
                    </TypographyP>
                </div>
            </>
        );
    }

    const current = simulate(
        data,
        activeHouse,
        listPrice,
        salaryAnnualGrowth,
        startDate
    );
    const adjusted = simulate(
        data,
        activeHouse,
        bid,
        salaryAnnualGrowth,
        startDate
    );

    const scenarios = SCENARIO_DELTAS_KR.map((d) =>
        simulate(
            data,
            activeHouse,
            listPrice + d,
            salaryAnnualGrowth,
            startDate
        )
    );

    return (
        <>
            <div className='container my-8 min-h-24'>
                <TypographyH1>Budplanlegging</TypographyH1>
                <TypographyP>
                    Se hvordan ulike bud på {activeHouse.name} påvirker
                    månedsbudsjettet ditt. Prisendringer gir tilsvarende endring
                    i lånebeløp (egenkapital holdes konstant).
                </TypographyP>
            </div>

            <section className='container space-y-10'>
                <div>
                    <Label htmlFor='bid-amount'>Ditt bud (kr)</Label>
                    <div className='flex items-center gap-2 mt-2 max-w-md'>
                        <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            aria-label={`Senk bud med ${BID_STEP}`}
                            onClick={() =>
                                setBid((b) => Math.max(0, b - BID_STEP))
                            }
                        >
                            <Minus size={16} />
                        </Button>
                        <NumericInput
                            id='bid-amount'
                            value={bid}
                            onChange={(e) =>
                                setBid(Number(e.target.value) || 0)
                            }
                            className='text-right font-mono'
                        />
                        <Button
                            type='button'
                            variant='outline'
                            size='icon'
                            aria-label={`Øk bud med ${BID_STEP}`}
                            onClick={() => setBid((b) => b + BID_STEP)}
                        >
                            <Plus size={16} />
                        </Button>
                    </div>
                    <div className='mt-3 text-sm text-muted-foreground'>
                        Prisantydning: {formatNumberToNOK(listPrice)} ·
                        Differanse:{' '}
                        <span
                            className={cn(
                                'font-mono',
                                adjusted.delta > 0
                                    ? 'text-foreground'
                                    : adjusted.delta < 0
                                    ? 'text-foreground'
                                    : 'text-muted-foreground'
                            )}
                        >
                            {formatSignedNOK(adjusted.delta)}
                        </span>
                        {listPrice > 0 && (
                            <>
                                {' '}
                                ({((adjusted.delta / listPrice) * 100).toFixed(1)}
                                %)
                            </>
                        )}
                    </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                    <BidGlance
                        title='Prisantydning'
                        subtitle={activeHouse.name}
                        sim={current}
                    />
                    <BidGlance
                        title='Ditt bud'
                        subtitle={
                            adjusted.delta === 0
                                ? 'Likt prisantydning'
                                : `${formatSignedNOK(adjusted.delta)} vs. prisantydning`
                        }
                        sim={adjusted}
                        comparison={current}
                    />
                </div>

                <div>
                    <TypographyH2>Hurtigscenarioer</TypographyH2>
                    <TypographyP>
                        Faste avvik fra prisantydning. Klikk for å sette buddet.
                    </TypographyP>
                    <div className='mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3'>
                        {scenarios.map((s) => (
                            <ScenarioCard
                                key={s.bidPrice}
                                sim={s}
                                listPrice={listPrice}
                                onSelect={() => setBid(s.bidPrice)}
                                active={s.bidPrice === bid}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}

function BidGlance({
    title,
    subtitle,
    sim,
    comparison,
}: {
    title: string;
    subtitle: string;
    sim: Simulation;
    comparison?: Simulation;
}) {
    const balanceDelta = comparison
        ? sim.monthOne.balance - comparison.monthOne.balance
        : undefined;

    return (
        <Glance
            title={title}
            subtitle={subtitle}
            indexLabel={formatNumberToNOK(sim.bidPrice)}
            footnote={
                balanceDelta !== undefined && balanceDelta !== 0 ? (
                    <>
                        <span>Endring i månedlig balanse</span>
                        <span className='font-mono tabular-nums'>
                            {formatSignedNOK(balanceDelta)}
                        </span>
                    </>
                ) : undefined
            }
        >
            <Glance.Row
                label='Lånebeløp'
                value={formatNumberToNOK(sim.loanAmount)}
            />
            <Glance.Row
                label='Renter (måned 1)'
                value={'− ' + formatNumberToNOK(sim.monthOne.totalInterest)}
            />
            <Glance.Row
                label='Avdrag (måned 1)'
                value={'− ' + formatNumberToNOK(sim.monthOne.totalPrincipal)}
            />
            <Glance.Row
                label='Øvrige utgifter'
                value={
                    '− ' +
                    formatNumberToNOK(
                        Math.max(
                            0,
                            sim.monthOne.expenses -
                                sim.monthOne.totalInterest -
                                sim.monthOne.totalPrincipal
                        )
                    )
                }
            />
            <Glance.Row
                label='Netto inntekt'
                value={'+ ' + formatNumberToNOK(sim.monthOne.income)}
            />
            <Glance.Total
                label='Månedlig balanse'
                value={formatSignedNOK(sim.monthOne.balance)}
            />
        </Glance>
    );
}

function ScenarioCard({
    sim,
    listPrice,
    onSelect,
    active,
}: {
    sim: Simulation;
    listPrice: number;
    onSelect: () => void;
    active: boolean;
}) {
    const pct = listPrice > 0 ? (sim.delta / listPrice) * 100 : 0;
    const pctLabel =
        sim.delta === 0
            ? 'Prisantydning'
            : `${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`;

    return (
        <button
            type='button'
            onClick={onSelect}
            className={cn(
                'text-left border rounded-md px-3 py-3 transition-colors',
                'hover:bg-muted/40',
                active
                    ? 'border-foreground bg-muted/30'
                    : 'border-border'
            )}
        >
            <div className='text-xs uppercase tracking-wider text-muted-foreground'>
                {pctLabel}
            </div>
            <div className='font-mono tabular-nums text-sm mt-1'>
                {formatNumberToNOK(sim.bidPrice)}
            </div>
            <div className='mt-2 text-xs text-muted-foreground'>
                Balanse
            </div>
            <div className='font-mono tabular-nums text-base'>
                {formatSignedNOK(sim.monthOne.balance)}
            </div>
        </button>
    );
}
