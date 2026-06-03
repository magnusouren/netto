'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NumericInput } from '@/components/ui/numeric-input';
import useStore, { StoreState } from '@/lib/store';
import type { FixedExpense } from '@/types';
import { Plus, Trash } from 'lucide-react';
import { Glance } from '@/components/ledger/Glance';
import { LabelMono } from '@/components/ledger/LabelMono';
import { Questionmark } from '@/components/Questionmark';
import { formatNumberToNOK } from '@/lib/utils';

export default function FixedExpenses() {
    const personalFixedExpenses = useStore(
        (s: StoreState) => s.data.personalFixedExpenses
    );
    const setData = useStore((s: StoreState) => s.setData);
    const hasHydrated = useStore((s) => s._hasHydrated);
    const addFixedExpense = useStore((s: StoreState) => s.addFixedExpense);
    const updateFixedExpense = useStore(
        (s: StoreState) => s.updateFixedExpense
    );
    const deleteFixedExpense = useStore(
        (s: StoreState) => s.deleteFixedExpense
    );

    const personalDefaults = ['Trening', 'Abonnementer', 'Forsikringer'];

    useEffect(() => {
        if (!hasHydrated) return;

        if (personalFixedExpenses.length === 0) {
            const defaults: FixedExpense[] = personalDefaults.map<FixedExpense>(
                (d) => ({
                    description: d,
                    amount: 0,
                    category: 'personal',
                })
            );
            setData((prev) => ({
                ...prev,
                personalFixedExpenses: defaults,
            }));
        }
    });

    function addExpense() {
        addFixedExpense({ description: '', amount: 0, category: 'personal' });
    }

    function updateExpense(index: number, patch: Partial<FixedExpense>) {
        updateFixedExpense(index, patch);
    }

    function deleteExpense(index: number) {
        deleteFixedExpense(index);
    }

    const total = personalFixedExpenses.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    return (
        <section className='w-full my-8'>
            <Glance
                density='compact'
                title={
                    <span className='inline-flex items-center gap-1.5'>
                        Faste personlige kostnader
                        <Questionmark helptext='Dine faste personlige månedskostnader. Boligrelaterte kostnader administreres på boligsiden.' />
                    </span>
                }
                subtitle='Per måned'
                indexLabel={`${personalFixedExpenses.length} post${personalFixedExpenses.length === 1 ? '' : 'er'}`}
            >
                <div className='grid grid-cols-[1fr_minmax(110px,160px)_36px] gap-2 items-center pb-1 border-b border-border/60'>
                    <LabelMono className='text-[10px]'>Beskrivelse</LabelMono>
                    <LabelMono className='text-[10px]'>Beløp</LabelMono>
                    <span />
                </div>

                {personalFixedExpenses.map((item, index) => (
                    <div
                        key={index}
                        className='grid grid-cols-[1fr_minmax(110px,160px)_36px] gap-2 items-center py-1.5'
                    >
                        <Input
                            id={`fixed-desc-${index}`}
                            value={item.description}
                            onChange={(e) =>
                                updateExpense(index, {
                                    description: e.target.value,
                                })
                            }
                        />
                        <NumericInput
                            id={`fixed-amount-${index}`}
                            className='font-mono'
                            value={item.amount}
                            onChange={(e) =>
                                updateExpense(index, {
                                    amount: Number(e.target.value || 0),
                                })
                            }
                        />
                        <Button
                            variant='ghost'
                            size='icon'
                            className='text-destructive hover:bg-destructive/10 hover:text-destructive'
                            onClick={() => deleteExpense(index)}
                        >
                            <Trash />
                        </Button>
                    </div>
                ))}

                <button
                    type='button'
                    onClick={() => addExpense()}
                    className='w-full flex items-center justify-center gap-2 py-2 mt-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer'
                >
                    <Plus className='h-3.5 w-3.5' /> Legg til utgift
                </button>

                {personalFixedExpenses.length !== 0 && (
                    <Glance.Total
                        label='Totalt per måned'
                        value={formatNumberToNOK(total)}
                    />
                )}
            </Glance>
        </section>
    );
}
