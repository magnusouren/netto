import type { EconomyData, HouseOption } from '@/types';
import { calculateAnnualTaxes } from './calcTaxes';
import { computeLoanAmortization } from './amortization';
import { loanPaymentPlan } from './loanPaymentPlan';
import {
    monthlyLoanPayment,
    totalHouseMonthlyCosts,
} from './houseFinance';

export type HouseMetrics = {
    houseId: string;
    houseName: string;

    // Purchase
    price: number;
    closingCosts: number;
    commonDebt: number;
    equityUsed: number;
    loanAmount: number;
    interestRate: number;
    termYears: number;
    expectedGrowthPct: number;

    // Monthly
    housingLoanMonthly: number;
    housingFixedMonthly: number;
    housingTotalMonthly: number;

    // Monthly cash flow
    monthlyIncomeGross: number;
    monthlyTax: number;
    monthlyIncomeNet: number;
    monthlyPersonalFixed: number;
    monthlyLivingCosts: number;
    monthlyPersonalLoans: number;
    monthlyDisposable: number;

    // Long-term
    equityAt5Years: number;
    equityAt10Years: number;
    totalInterestOverLifetime: number;
};

function withActiveHouse(data: EconomyData, houseId: string): EconomyData {
    return { ...data, activeHouseId: houseId };
}

export function computeHouseMetrics(
    data: EconomyData,
    house: HouseOption
): HouseMetrics {
    const perturbed = withActiveHouse(data, house.id);

    const price = house.purchase.price || 0;
    const closingCosts = house.purchase.closingCosts || 0;
    const commonDebt = house.purchase.commonDebt || 0;
    const equityUsed = house.purchase.equityUsed || 0;
    const loanAmount = house.housingLoan.loanAmount || 0;
    const interestRate = house.housingLoan.interestRate || 0;
    const termYears = house.housingLoan.termYears || 0;
    const expectedGrowthPct = house.purchase.expectedGrowthPct ?? 0;

    const housingLoanMonthly = monthlyLoanPayment(house.housingLoan);
    const housingFixedMonthly = totalHouseMonthlyCosts(house.houseMonthlyCosts);
    const housingTotalMonthly = housingLoanMonthly + housingFixedMonthly;

    // Tax-adjusted
    const tax = calculateAnnualTaxes(perturbed);
    const monthlyTax = tax.totalTaxes / 12;

    const totalIncomeAnnual = (perturbed.incomes || []).reduce(
        (s, i) => s + i.amount,
        0
    );
    const monthlyIncomeGross = totalIncomeAnnual / 12;

    const personalFixed = (perturbed.personalFixedExpenses || []).reduce(
        (s, f) => s + f.amount,
        0
    );
    const livingMonthly = (perturbed.livingCosts || []).reduce(
        (s, l) => s + l.amount,
        0
    );
    const personalLoansMonthly = (perturbed.loans || []).reduce(
        (s, l) => s + (l.loanAmount > 0 ? monthlyLoanPayment(l) : 0),
        0
    );

    const totalMonthlyExpenses =
        housingTotalMonthly +
        personalFixed +
        livingMonthly +
        personalLoansMonthly;

    const monthlyDisposable =
        monthlyIncomeGross - monthlyTax - totalMonthlyExpenses;

    // Long-term equity via the existing payment plan helper
    const plan10 = loanPaymentPlan(
        { ...house.housingLoan, capital: equityUsed },
        expectedGrowthPct,
        10
    );
    const equityAt5Years =
        plan10[Math.min(plan10.length - 1, 5 * 12 - 1)]?.equity ?? 0;
    const equityAt10Years =
        plan10[plan10.length - 1]?.equity ?? 0;

    const totalInterestOverLifetime =
        computeLoanAmortization(house.housingLoan).totals.totalInterest;

    return {
        houseId: house.id,
        houseName: house.name,
        price,
        closingCosts,
        commonDebt,
        equityUsed,
        loanAmount,
        interestRate,
        termYears,
        expectedGrowthPct,
        housingLoanMonthly,
        housingFixedMonthly,
        housingTotalMonthly,
        monthlyIncomeGross,
        monthlyTax,
        monthlyIncomeNet: monthlyIncomeGross - monthlyTax,
        monthlyPersonalFixed: personalFixed,
        monthlyLivingCosts: livingMonthly,
        monthlyPersonalLoans: personalLoansMonthly,
        monthlyDisposable,
        equityAt5Years,
        equityAt10Years,
        totalInterestOverLifetime,
    };
}
