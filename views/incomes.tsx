'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import { Plus, Trash } from 'lucide-react';
import useStore, { StoreState } from '@/lib/store';
import type { Income } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Glance } from '@/components/ledger/Glance';
import { LabelMono } from '@/components/ledger/LabelMono';
import { Questionmark } from '@/components/Questionmark';
import { formatNumberToNOK } from '@/lib/utils';

export default function Incomes() {
    const incomes = useStore((s: StoreState) => s.data.incomes);
    const addIncome = useStore((s: StoreState) => s.addIncome);
    const updateIncome = useStore((s: StoreState) => s.updateIncome);
    const deleteIncome = useStore((s: StoreState) => s.deleteIncome);

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
                        <Questionmark helptext='Årlige netto faste inntekter — både skattepliktige og skattefrie kilder.' />
                    </span>
                }
                subtitle='Årlige beløp'
                indexLabel={`${incomes.length} kilde${incomes.length === 1 ? '' : 'r'}`}
            >
                {incomes.length !== 0 && (
                    <div className='grid grid-cols-[1fr_minmax(110px,160px)_80px_36px] gap-2 items-center pb-1 border-b border-border/60'>
                        <LabelMono className='text-[10px]'>Kilde</LabelMono>
                        <LabelMono className='text-[10px]'>Beløp</LabelMono>
                        <LabelMono className='text-[10px]'>Skattefritt</LabelMono>
                        <span />
                    </div>
                )}

                {incomes.map((income: Income, index: number) => (
                        <div
                            key={index}
                            className='grid grid-cols-[1fr_minmax(110px,160px)_80px_36px] gap-2 items-center py-1.5'
                        >
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
                            <NumericInput
                                id={`income-amount-${index}`}
                                className='font-mono'
                                value={income.amount}
                                onChange={(e) =>
                                    updateIncome(index, {
                                        amount: Number(e.target.value || 0),
                                    })
                                }
                            />
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
                    ))}

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
