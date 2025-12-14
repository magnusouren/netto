'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
    EconomyData,
    Income,
    Loan,
    FixedExpense,
    LivingCost,
    HouseOption,
    HouseMonthlyCosts,
} from '@/types';

const defaultHouseMonthlyCosts: HouseMonthlyCosts = {
    hoa: 0,
    electricity: 0,
    internet: 0,
    insurance: 0,
    propertyTax: 0,
    maintenance: 0,
    other: 0,
};

const createDefaultHouse = (name = 'New House'): HouseOption => ({
    id: crypto.randomUUID(),
    name,
    purchase: {
        price: 0,
        equityUsed: 0,
        expectedGrowthPct: 0,
        closingCosts: 0,
    },
    housingLoan: {
        description: 'Boliglån',
        loanAmount: 0,
        interestRate: 0,
        termYears: 25,
        termsPerYear: 12,
        startDate: new Date().toISOString().slice(0, 10),
    },
    houseMonthlyCosts: { ...defaultHouseMonthlyCosts },
});

const defaultData: EconomyData = {
    incomes: [],
    loans: [],
    personalFixedExpenses: [],
    livingCosts: [],
    personalEquity: 0,
    houses: [],
    activeHouseId: '',
};

type Updater = (draft: EconomyData) => EconomyData;

export interface StoreState {
    data: EconomyData;
    setData: (updater: EconomyData | Updater) => void;

    _hasHydrated: boolean;
    setHasHydrated: (value: boolean) => void;

    // Personal Equity
    setPersonalEquity: (amount: number) => void;

    // Active House
    setActiveHouseId: (id: string) => void;
    getActiveHouse: () => HouseOption | undefined;

    // Incomes
    addIncome: (inc?: Partial<Income>) => void;
    updateIncome: (index: number, patch: Partial<Income>) => void;
    deleteIncome: (index: number) => void;

    // Loans (non-housing)
    addLoan: (loan?: Partial<Loan>) => void;
    updateLoan: (index: number, patch: Partial<Loan>) => void;
    deleteLoan: (index: number) => void;

    // Houses
    addHouse: (house?: Partial<HouseOption>) => void;
    updateHouse: (id: string, patch: Partial<HouseOption>) => void;
    updateHouseLoan: (houseId: string, patch: Partial<Loan>) => void;
    updateHouseMonthlyCosts: (
        houseId: string,
        patch: Partial<HouseMonthlyCosts>
    ) => void;
    deleteHouse: (id: string) => void;

    // Fixed expenses (personal)
    addFixedExpense: (exp?: Partial<FixedExpense>) => void;
    updateFixedExpense: (index: number, patch: Partial<FixedExpense>) => void;
    deleteFixedExpense: (index: number) => void;

    // Living costs
    addLivingCost: (lc?: Partial<LivingCost>) => void;
    updateLivingCost: (index: number, patch: Partial<LivingCost>) => void;
    deleteLivingCost: (index: number) => void;
}

export const useStore = create<StoreState>()(
    persist(
        (set, get) => ({
            data: defaultData,

            // Hydration flags
            _hasHydrated: false,
            setHasHydrated: (v) => set({ _hasHydrated: v }),

            setData: (updater) => {
                set((state) => {
                    const next =
                        typeof updater === 'function'
                            ? (updater as Updater)(state.data)
                            : updater;
                    return { data: next };
                });
            },

            // Personal Equity
            setPersonalEquity: (amount) =>
                set((s) => ({
                    data: { ...s.data, personalEquity: amount },
                })),

            // Active House
            setActiveHouseId: (id) =>
                set((s) => ({
                    data: { ...s.data, activeHouseId: id },
                })),

            getActiveHouse: () => {
                const state = get();
                return (state.data.houses || []).find(
                    (h) => h.id === state.data.activeHouseId
                );
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

            // Loans (non-housing)
            addLoan: (
                loan = {
                    description: '',
                    loanAmount: 0,
                    interestRate: 0,
                    termYears: 25,
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

            // Houses
            addHouse: (house) =>
                set((s) => {
                    const newHouse = house?.id
                        ? (house as HouseOption)
                        : {
                              ...createDefaultHouse(house?.name),
                              ...house,
                          };
                    const newHouses = [...s.data.houses, newHouse];
                    // If this is the first house, set it as active
                    const activeId = s.data.activeHouseId || newHouse.id;
                    return {
                        data: {
                            ...s.data,
                            houses: newHouses,
                            activeHouseId: activeId,
                        },
                    };
                }),

            updateHouse: (id, patch) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        houses: s.data.houses.map((h) =>
                            h.id === id ? { ...h, ...patch } : h
                        ),
                    },
                })),

            updateHouseLoan: (houseId, patch) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        houses: s.data.houses.map((h) =>
                            h.id === houseId
                                ? {
                                      ...h,
                                      housingLoan: {
                                          ...h.housingLoan,
                                          ...patch,
                                      },
                                  }
                                : h
                        ),
                    },
                })),

            updateHouseMonthlyCosts: (houseId, patch) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        houses: s.data.houses.map((h) =>
                            h.id === houseId
                                ? {
                                      ...h,
                                      houseMonthlyCosts: {
                                          ...h.houseMonthlyCosts,
                                          ...patch,
                                      },
                                  }
                                : h
                        ),
                    },
                })),

            deleteHouse: (id) =>
                set((s) => {
                    const newHouses = s.data.houses.filter((h) => h.id !== id);
                    // If we deleted the active house, pick another
                    let newActiveId = s.data.activeHouseId;
                    if (newActiveId === id) {
                        newActiveId = newHouses[0]?.id || '';
                    }
                    return {
                        data: {
                            ...s.data,
                            houses: newHouses,
                            activeHouseId: newActiveId,
                        },
                    };
                }),

            // Fixed expenses (personal)
            addFixedExpense: (
                exp = { description: '', amount: 0, category: 'personal' }
            ) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        personalFixedExpenses: [
                            ...s.data.personalFixedExpenses,
                            exp as FixedExpense,
                        ],
                    },
                })),

            updateFixedExpense: (index, patch) =>
                set((s) => {
                    const list = [...s.data.personalFixedExpenses];
                    list[index] = { ...list[index], ...patch };
                    return { data: { ...s.data, personalFixedExpenses: list } };
                }),

            deleteFixedExpense: (index) =>
                set((s) => ({
                    data: {
                        ...s.data,
                        personalFixedExpenses:
                            s.data.personalFixedExpenses.filter(
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

        // Persist config
        {
            name: 'economics-store',

            onRehydrateStorage: () => (state) => {
                // mark hydration complete
                state?.setHasHydrated(true);
            },
        }
    )
);

export default useStore;
