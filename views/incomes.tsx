'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { AlertTriangle, Plus, Trash } from 'lucide-react';
import useStore, { StoreState } from '@/lib/store';
import type { Income } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Glance } from '@/components/ledger/Glance';
import { LabelMono } from '@/components/ledger/LabelMono';
import { Questionmark } from '@/components/Questionmark';
import { formatNumberToNOK } from '@/lib/utils';

const YEARLY_SUSPICIOUS_THRESHOLD = 100_000;

export default function Incomes() {
    const incomes = useStore((s: StoreState) => s.data.incomes);
    const addIncome = useStore((s: StoreState) => s.addIncome);
    const updateIncome = useStore((s: StoreState) => s.updateIncome);
    const deleteIncome = useStore((s: StoreState) => s.deleteIncome);
    const [focusedAmountIndex, setFocusedAmountIndex] = useState<number | null>(
        null
    );

    const totalIncome = incomes.reduce(
        (total: number, income: Income) => total + income.amount,
        0
    );

    return (
        <section className='w-full my-8'>
            <Glance
                density='compact'
                title={
                    <span className='inline-flex items-center gap-1.5'>
                        Inntekter
                        <Questionmark helptext='Årlige netto faste inntekter, både skattepliktige og skattefrie kilder.' />
                    </span>
                }
                subtitle='Årlige beløp'
                indexLabel={`${incomes.length} kilde${incomes.length === 1 ? '' : 'r'}`}
            >
                {incomes.length !== 0 && (
                    <div className='grid grid-cols-[1fr_minmax(80px,110px)_48px_36px] gap-2 items-center pb-1 border-b border-border/60'>
                        <LabelMono className='text-[10px]'>Kilde</LabelMono>
                        <LabelMono className='text-[10px]'>Beløp /år</LabelMono>
                        <span className='inline-flex items-center justify-center gap-1'>
                            <LabelMono className='text-[10px]'>SF</LabelMono>
                            <Questionmark helptext='Skattefritt? Marker dersom inntekten ikke skal beskattes.' />
                        </span>
                        <span />
                    </div>
                )}

                {incomes.map((income: Income, index: number) => {
                    const showLowWarning =
                        focusedAmountIndex !== index &&
                        income.amount > 0 &&
                        income.amount < YEARLY_SUSPICIOUS_THRESHOLD;
                    return (
                        <div key={index} className='py-1.5'>
                            <div className='grid grid-cols-[1fr_minmax(80px,110px)_48px_36px] gap-2 items-center'>
                                <Input
                                    id={`income-source-${index}`}
                                    type='text'
                                    value={income.source || ''}
                                    placeholder='Fast jobb'
                                    onChange={(e) =>
                                        updateIncome(index, {
                                            source: e.target.value,
                                        })
                                    }
                                />
                                <div className='relative'>
                                    <NumericInput
                                        id={`income-amount-${index}`}
                                        className='font-mono pr-9'
                                        value={income.amount}
                                        aria-invalid={showLowWarning}
                                        onFocus={() =>
                                            setFocusedAmountIndex(index)
                                        }
                                        onBlur={() =>
                                            setFocusedAmountIndex((curr) =>
                                                curr === index ? null : curr
                                            )
                                        }
                                        onChange={(e) =>
                                            updateIncome(index, {
                                                amount: Number(
                                                    e.target.value || 0
                                                ),
                                            })
                                        }
                                    />
                                    <span
                                        aria-hidden
                                        className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-muted-foreground'
                                    >
                                        /år
                                    </span>
                                </div>
                                <div className='flex justify-center'>
                                    <Checkbox
                                        id={`income-taxFree-${index}`}
                                        checked={!!income.taxFree}
                                        className='h-4 w-4 border'
                                        onCheckedChange={(checked) =>
                                            updateIncome(index, {
                                                taxFree: !!checked,
                                            })
                                        }
                                    />
                                </div>
                                <Button
                                    variant='ghost'
                                    size='icon'
                                    className='text-destructive hover:bg-destructive/10 hover:text-destructive'
                                    onClick={() => deleteIncome(index)}
                                >
                                    <Trash />
                                </Button>
                            </div>
                            {showLowWarning && (
                                <div className='mt-1.5 flex items-center justify-between gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-900 dark:text-amber-200'>
                                    <span className='inline-flex items-center gap-1.5'>
                                        <AlertTriangle className='h-3.5 w-3.5 shrink-0' />
                                        Var dette per måned? Årsbeløp blir{' '}
                                        <span className='font-mono font-medium'>
                                            {formatNumberToNOK(
                                                income.amount * 12
                                            )}
                                        </span>
                                        .
                                    </span>
                                    <button
                                        type='button'
                                        onClick={() =>
                                            updateIncome(index, {
                                                amount: income.amount * 12,
                                            })
                                        }
                                        className='shrink-0 rounded border border-amber-600/50 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-amber-900 hover:bg-amber-500/20 dark:text-amber-100 dark:border-amber-400/60 cursor-pointer'
                                    >
                                        × 12
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}

                <button
                    type='button'
                    onClick={() => addIncome()}
                    className='w-full flex items-center justify-center gap-2 py-2 mt-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer'
                >
                    <Plus className='h-3.5 w-3.5' /> Legg til inntekt
                </button>

                {incomes.length !== 0 && (
                    <Glance.Total
                        label='Totalt per år'
                        value={formatNumberToNOK(totalIncome)}
                    />
                )}
            </Glance>
        </section>
    );
}
