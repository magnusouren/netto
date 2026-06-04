import type { EconomyData, Loan } from '@/types';
import { calculateAnnualTaxes } from './calcTaxes';
import { monthlyLoanPayment, totalHouseMonthlyCosts } from './houseFinance';

export type InterestScenario = {
    delta: number;
    sumMonthlyPayment: number;
    housingMonthlyPayment: number;
    personalLoansMonthlyPayment: number;
    annualInterest: number;
    monthlyTax: number;
    monthlyDisposable: number;
};

function shiftLoanRate(loan: Loan, delta: number): Loan {
    return {
        ...loan,
        interestRate: Math.max(0, (loan.interestRate || 0) + delta),
    };
}

function shiftEconomyRates(data: EconomyData, delta: number): EconomyData {
    return {
        ...data,
        houses: (data.houses || []).map((h) =>
            h.id === data.activeHouseId
                ? { ...h, housingLoan: shiftLoanRate(h.housingLoan, delta) }
                : h
        ),
    };
}

/**
 * Returns the scenario summary for a single rate delta (in percentage points).
 * The delta is added to the active housing loan only (clamped at 0). Personal
 * loans keep their current rates.
 */
export function computeInterestScenario(
    data: EconomyData,
    delta: number
): InterestScenario {
    const perturbed = shiftEconomyRates(data, delta);
    const activeHouse = (perturbed.houses || []).find(
        (h) => h.id === perturbed.activeHouseId
    );

    const housingMonthlyPayment = activeHouse
        ? monthlyLoanPayment(activeHouse.housingLoan)
        : 0;
    const personalLoansMonthlyPayment = (perturbed.loans || []).reduce(
        (s, l) => s + (l.loanAmount > 0 ? monthlyLoanPayment(l) : 0),
        0
    );
    const sumMonthlyPayment =
        housingMonthlyPayment + personalLoansMonthlyPayment;

    const tax = calculateAnnualTaxes(perturbed);
    const monthlyTax = tax.totalTaxes / 12;

    const totalIncomeAnnual = (perturbed.incomes || []).reduce(
        (s, i) => s + i.amount,
        0
    );
    const monthlyIncomeGross = totalIncomeAnnual / 12;

    const housingFixed = activeHouse
        ? totalHouseMonthlyCosts(activeHouse.houseMonthlyCosts)
        : 0;
    const personalFixed = (perturbed.personalFixedExpenses || []).reduce(
        (s, f) => s + f.amount,
        0
    );
    const livingMonthly = (perturbed.livingCosts || []).reduce(
        (s, l) => s + l.amount,
        0
    );

    const totalMonthlyExpenses =
        housingFixed +
        personalFixed +
        livingMonthly +
        sumMonthlyPayment;

    const monthlyDisposable =
        monthlyIncomeGross - monthlyTax - totalMonthlyExpenses;

    return {
        delta,
        sumMonthlyPayment,
        housingMonthlyPayment,
        personalLoansMonthlyPayment,
        annualInterest: tax.totalPaidInterest,
        monthlyTax,
        monthlyDisposable,
    };
}

export const INTEREST_DELTAS = [
    -1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1,
] as const;

export function computeInterestScenarios(
    data: EconomyData,
    deltas: readonly number[] = INTEREST_DELTAS
): InterestScenario[] {
    return deltas.map((d) => computeInterestScenario(data, d));
}
