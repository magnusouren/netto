'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React, { useState } from 'react';
import type { Income } from '@/types';
import { Cog, Plus, Save, Trash } from 'lucide-react';

type Props = {
    initialIncome?: Income;
    onSubmit?: (income: Income) => void;
    onDelete?: (income: Income) => void;
};

export default function Income({ initialIncome, onSubmit, onDelete }: Props) {
    const [income, setIncome] = useState<Income>(
        () => initialIncome ?? { source: '', amount: 0 }
    );
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(initialIncome?.source ?? '');

    function saveTitle() {
        const updated = { ...income, source: titleDraft } as Income;
        setIncome(updated);
        setEditingTitle(false);
        onSubmit?.(updated);
    }

    function handleChangeAmount(e: React.ChangeEvent<HTMLInputElement>) {
        const value = e.target.value;
        const num = value === '' ? 0 : Number(value);
        setIncome((prev) => ({ ...prev, amount: Number.isNaN(num) ? 0 : num }));
    }

    function handleSubmit(e?: React.FormEvent) {
        e?.preventDefault();
        onSubmit?.(income);
    }

    function handleDelete() {
        onDelete?.(income);
    }

    return (
        <Card className='w-full max-w-xs gap-2'>
            <CardHeader>
                <div className='flex items-center justify-between w-full gap-2'>
                    {editingTitle ? (
                        <div className='flex items-center gap-2 w-full'>
                            <Input
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                placeholder='Tittel på inntekt'
                                className='flex-1'
                            />
                            <Button
                                type='button'
                                variant='outline'
                                size='icon'
                                className='border-red-500 text-red-500 hover:bg-red-100 hover:border-red-600 hover:text-red-600'
                                onClick={() => {
                                    handleDelete();
                                }}
                            >
                                <Trash />
                            </Button>
                            <Button
                                type='button'
                                onClick={saveTitle}
                                size='icon'
                            >
                                <Save />
                            </Button>
                        </div>
                    ) : (
                        <div className='flex items-center gap-2 w-full'>
                            <CardTitle className='flex-1'>
                                {income.source || 'Inntekt'}
                            </CardTitle>
                            <Button
                                type='button'
                                variant='outline'
                                className='p-2'
                                size='icon'
                                onClick={() => setEditingTitle(true)}
                            >
                                <Cog />
                            </Button>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className='flex flex-col gap-6'>
                        <div className='grid gap-2'>
                            <Label htmlFor='amount'>Beløp</Label>
                            <Input
                                id='amount'
                                type='number'
                                placeholder='Årlig beløp'
                                required
                                value={income.amount}
                                onChange={handleChangeAmount}
                            />
                        </div>

                        <Button className='w-full' type='submit'>
                            Legg til <Plus />
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
