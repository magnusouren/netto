'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    EconomyData,
    Income,
    Loan,
    HousingLoan,
    FixedExpense,
    LivingCost,
} from '@/types';

const defaultData: EconomyData = {
    incomes: [],
    housingLoans: [],
    loans: [],
    fixedExpenses: [],
    livingCosts: [],
};

type Updater = (draft: EconomyData) => EconomyData;

export interface StoreState {
    data: EconomyData;
    setData: (updater: EconomyData | Updater) => void;

    // Incomes
    addIncome: (inc?: Partial<Income>) => void;
    updateIncome: (index: number, patch: Partial<Income>) => void;
    deleteIncome: (index: number) => void;

    // Loans (student + other)
    addLoan: (loan?: Partial<Loan>) => void;
    updateLoan: (index: number, patch: Partial<Loan>) => void;
    deleteLoan: (index: number) => void;

    // Housing loans
    addHousingLoan: (loan?: Partial<HousingLoan>) => void;
    updateHousingLoan: (index: number, patch: Partial<HousingLoan>) => void;
    deleteHousingLoan: (index: number) => void;

    // Fixed expenses
    addFixedExpense: (exp?: Partial<FixedExpense>) => void;
    updateFixedExpense: (index: number, patch: Partial<FixedExpense>) => void;
    deleteFixedExpense: (index: number) => void;

    // Living costs
    addLivingCost: (lc?: Partial<LivingCost>) => void;
    updateLivingCost: (index: number, patch: Partial<LivingCost>) => void;
    deleteLivingCost: (index: number) => void;
}

export const useStore = create<StoreState>()(
    persist<StoreState>(
        (set) => ({
            data: defaultData,

            setData: (updater) => {
                set((state) => {
                    const next =
                        typeof updater === 'function'
                            ? (updater as Updater)(state.data)
                            : updater;
                    return { data: next };
                });
            },

            // Incomes
            addIncome: (inc = { source: '', amount: 0 }) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        incomes: [...s.data.incomes, inc as Income],
                    },
                })),

            updateIncome: (index, patch) =>
                set((s) => {
                    const list = [...s.data.incomes];
                    list[index] = { ...list[index], ...patch };
                    return { data: { ...s.data, incomes: list } };
                }),

            deleteIncome: (index) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        incomes: s.data.incomes.filter((_, i) => i !== index),
                    },
                })),

            // Loans
            addLoan: (
                loan = {
                    description: '',
                    loanAmount: 0,
                    interestRate: 0,
                    termYears: 0,
                    termsPerYear: 12,
                    startDate: new Date().toISOString().slice(0, 10),
                }
            ) =>
                set((s) => ({
                    data: { ...s.data, loans: [...s.data.loans, loan as Loan] },
                })),

            updateLoan: (index, patch) =>
                set((s) => {
                    const list = [...s.data.loans];
                    list[index] = { ...list[index], ...patch };
                    return { data: { ...s.data, loans: list } };
                }),

            deleteLoan: (index) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        loans: s.data.loans.filter((_, i) => i !== index),
                    },
                })),

            // Housing loans
            addHousingLoan: (
                loan = {
                    description: 'Boliglån',
                    loanAmount: 0,
                    interestRate: 0,
                    termYears: 0,
                    termsPerYear: 12,
                    capital: 0,
                    startDate: new Date().toISOString().slice(0, 10),
                }
            ) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        housingLoans: [
                            ...s.data.housingLoans,
                            loan as HousingLoan,
                        ],
                    },
                })),

            updateHousingLoan: (index, patch) =>
                set((s) => {
                    const list = [...s.data.housingLoans];
                    list[index] = { ...list[index], ...patch };
                    return { data: { ...s.data, housingLoans: list } };
                }),

            deleteHousingLoan: (index) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        housingLoans: s.data.housingLoans.filter(
                            (_, i) => i !== index
                        ),
                    },
                })),

            // Fixed expenses
            addFixedExpense: (
                exp = { description: '', amount: 0, category: 'personal' }
            ) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        fixedExpenses: [
                            ...s.data.fixedExpenses,
                            exp as FixedExpense,
                        ],
                    },
                })),

            updateFixedExpense: (index, patch) =>
                set((s) => {
                    const list = [...s.data.fixedExpenses];
                    list[index] = { ...list[index], ...patch };
                    return { data: { ...s.data, fixedExpenses: list } };
                }),

            deleteFixedExpense: (index) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        fixedExpenses: s.data.fixedExpenses.filter(
                            (_, i) => i !== index
                        ),
                    },
                })),

            // Living costs
            addLivingCost: (lc = { description: '', amount: 0 }) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        livingCosts: [...s.data.livingCosts, lc as LivingCost],
                    },
                })),

            updateLivingCost: (index, patch) =>
                set((s) => {
                    const list = [...s.data.livingCosts];
                    list[index] = { ...list[index], ...patch };
                    return { data: { ...s.data, livingCosts: list } };
                }),

            deleteLivingCost: (index) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        livingCosts: s.data.livingCosts.filter(
                            (_, i) => i !== index
                        ),
                    },
                })),
        }),
        {
            name: 'economics-store',
        }
    )
);

export default useStore;
