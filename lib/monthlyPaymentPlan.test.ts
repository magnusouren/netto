import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EconomyData, HouseOption } from '@/types';
import { computeLoanAmortization } from './amortization';
import { generatePaymentPlan } from './monthlyPaymentPlan';

const housingLoan = {
    description: 'Condo loan',
    loanAmount: 400_000,
    interestRate: 3.2,
    termYears: 8,
    termsPerYear: 12,
    monthlyFee: 15,
    startDate: '2024-01-01',
};

const testHouse: HouseOption = {
    id: 'test-house-1',
    name: 'Test Condo',
    purchase: {
        price: 480_000,
        equityUsed: 80_000,
        expectedGrowthPct: 2,
        closingCosts: 0,
    },
    housingLoan,
    houseMonthlyCosts: {
        hoa: 2_000,
        electricity: 800,
        internet: 400,
        insurance: 0,
        propertyTax: 0,
        maintenance: 0,
        other: 0,
    },
};

const studentLoan = {
    description: 'Student loan',
    loanAmount: 120_000,
    interestRate: 2.5,
    termYears: 10,
    termsPerYear: 12,
    monthlyFee: 0,
    startDate: '2024-01-01',
};

const economy: EconomyData = {
    incomes: [
        { source: 'Salary', amount: 540_000 },
        { source: 'Freelance', amount: 60_000 },
    ],
    loans: [studentLoan],
    personalFixedExpenses: [
        { description: 'Insurance', amount: 1_100, category: 'personal' },
    ],
    livingCosts: [
        { description: 'Groceries', amount: 4_500 },
        { description: 'Transport', amount: 1_000 },
    ],
    personalEquity: 100_000,
    houses: [testHouse],
    activeHouseId: 'test-house-1',
};

describe('generatePaymentPlan', () => {
    const plan = generatePaymentPlan(economy, 3, '2024-01-01', 1);
    
    // Housing costs + personal fixed + living costs
    const housingCosts = 2_000 + 800 + 400; // from houseMonthlyCosts
    const personalFixed = 1_100;
    const livingCosts = 4_500 + 1_000;
    const baseFixedCosts = housingCosts + personalFixed + livingCosts;

    it('creates a one-year projection with monthly balances', () => {
        assert.equal(plan.length, 12);
        assert.ok(plan[0].month.includes('2024'));
        assert.ok(plan.every((row) => row.expenses >= baseFixedCosts));
    });

    it('applies salary growth and accounts for housing principal', () => {
        const augustIncome = plan[7].income;
        const julyIncome = plan[6].income;
        assert.ok(augustIncome > julyIncome);

        const principalContribution = plan[0].balancePlusPrincipal - plan[0].balance;
        assert.ok(principalContribution >= 0);
    });

    it('keeps balances in a reasonable range compared to income', () => {
        const highestIncome = Math.max(...plan.map((row) => row.income));
        const lowestBalance = Math.min(...plan.map((row) => row.balance));
        assert.ok(lowestBalance > -highestIncome); // avoid runaway debt within the year
    });
});
