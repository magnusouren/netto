import { computeLoanAmortization } from './amortization';
import type { Loan } from '@/types';

const buildLoanCacheKey = (loan: Loan) =>
    [
        loan.description,
        loan.loanAmount,
        loan.interestRate,
        loan.termYears,
        loan.termsPerYear,
        loan.monthlyFee ?? 0,
        loan.startDate,
    ].join('|');

export function createAmortizationCache() {
    const cache = new Map<string, ReturnType<typeof computeLoanAmortization>>();

    return {
        get: (loan: Loan) => {
            const key = buildLoanCacheKey(loan);
            const cached = cache.get(key);

            if (cached) return cached;

            const amortization = computeLoanAmortization(loan);
            cache.set(key, amortization);
            return amortization;
        },
    };
}

export type AmortizationLookup = ReturnType<typeof createAmortizationCache>;
export { buildLoanCacheKey };
