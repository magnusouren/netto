import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EconomyData, HouseOption } from '@/types';
import { computeLoanAmortization } from './amortization';
import { calculateAnnualTaxes } from './calcTaxes';

const housingLoan = {
    description: 'Boliglån',
    loanAmount: 320_000,
    interestRate: 3.6,
    termYears: 10,
    termsPerYear: 12,
    monthlyFee: 25,
    startDate: '2024-01-01',
};

const testHouse: HouseOption = {
    id: 'test-house-1',
    name: 'Starter home',
    purchase: {
        price: 370_000,
        equityUsed: 50_000,
        expectedGrowthPct: 2,
        closingCosts: 0,
    },
    housingLoan,
    houseMonthlyCosts: {
        hoa: 0,
        electricity: 0,
        internet: 0,
        insurance: 0,
        propertyTax: 0,
        maintenance: 0,
        other: 0,
    },
};

const carLoan = {
    description: 'Car loan',
    loanAmount: 60_000,
    interestRate: 6.5,
    termYears: 5,
    termsPerYear: 12,
    monthlyFee: 0,
    startDate: '2024-01-01',
};

const economy: EconomyData = {
    incomes: [
        { source: 'Salary', amount: 620_000 },
        { source: 'Bonus', amount: 35_000 },
        { source: 'Child support', amount: 24_000, taxFree: true },
    ],
    loans: [carLoan],
    personalFixedExpenses: [],
    livingCosts: [],
    personalEquity: 100_000,
    houses: [testHouse],
    activeHouseId: 'test-house-1',
};

describe('calculateAnnualTaxes', () => {
    const result = calculateAnnualTaxes(economy);

    it('computes gross income and deductions from loans', () => {
        assert.equal(result.totalIncome, 655_000);

        const housingInterest = computeLoanAmortization(housingLoan)
            .monthly.slice(0, 12)
            .reduce((sum, row) => sum + row.interest, 0);

        const carInterest = computeLoanAmortization(carLoan)
            .monthly.slice(0, 12)
            .reduce((sum, row) => sum + row.interest, 0);

        const expectedInterest = Math.round(housingInterest + carInterest);
        const expectedMinstefradrag = Math.round(
            Math.min(result.totalIncome * 0.46, 95_700),
        );
        const expectedTotalDeductions = Math.round(
            expectedMinstefradrag + expectedInterest,
        );
        const expectedAlminnelig = Math.round(
            Math.max(result.totalIncome - expectedTotalDeductions, 0),
        );

        assert.equal(result.totalPaidInterest, expectedInterest);
        assert.equal(result.minstefradrag, expectedMinstefradrag);
        assert.equal(result.totalInterestDeduction, expectedInterest);
        assert.equal(result.totalDeductions, expectedTotalDeductions);
        assert.equal(result.alminnelig, expectedAlminnelig);
    });

    it('returns reasonable effective rates and net values', () => {
        assert.ok(result.effectiveTaxRate > 0);
        assert.ok(result.netAnnualIncome > 0);
        assert.ok(result.netMonthlyIncome > 0);
    });
});
