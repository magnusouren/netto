import type { Loan, HouseMonthlyCosts } from '@/types';

export function monthlyLoanPayment(loan: Loan): number {
    const principal = loan.loanAmount || 0;
    const termsPerYear = loan.termsPerYear || 12;
    const termYears = loan.termYears || 0;
    const n = termYears * termsPerYear;
    if (n <= 0 || principal <= 0) return 0;

    const r = (loan.interestRate || 0) / 100 / termsPerYear;

    const paymentPerTerm =
        r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));

    return paymentPerTerm * (12 / termsPerYear) + (loan.monthlyFee || 0);
}

export function totalHouseMonthlyCosts(costs: HouseMonthlyCosts): number {
    return (
        (costs.hoa || 0) +
        (costs.electricity || 0) +
        (costs.internet || 0) +
        (costs.insurance || 0) +
        (costs.propertyTax || 0) +
        (costs.maintenance || 0) +
        (costs.other || 0)
    );
}

// Personal mortgage = price + closing costs - equity. Common debt (fellesgjeld)
// is excluded because it is serviced via felleskostnader, not the buyer's loan.
export function computeHousingLoanAmount(purchase: {
    price?: number;
    closingCosts?: number;
    equityUsed?: number;
}): number {
    const loan =
        (purchase.price || 0) +
        (purchase.closingCosts || 0) -
        (purchase.equityUsed || 0);
    return loan > 0 ? loan : 0;
}

export function totalPurchasePrice(purchase: {
    price?: number;
    closingCosts?: number;
    commonDebt?: number;
}): number {
    return (
        (purchase.price || 0) +
        (purchase.closingCosts || 0) +
        (purchase.commonDebt || 0)
    );
}
