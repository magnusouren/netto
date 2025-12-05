import { HousingLoan } from '@/types';
import { computeLoanAmortization } from './amortization';

export function loanPaymentPlan(
    loan: HousingLoan,
    priceIncrease: number, // annual %
    yearsToShow: number
) {
    const amort = computeLoanAmortization(loan);

    const { loanAmount, capital, startDate, termsPerYear, termYears } = loan;

    const totalPayments = termYears * termsPerYear;
    const maxPaymentsToShow = Math.min(
        yearsToShow * termsPerYear,
        totalPayments
    );

    // Base housing value = loan + equity contribution
    let housingValue = loanAmount + capital;

    const start = new Date(startDate);
    start.setDate(1);

    const monthlyGrowthRate = Math.pow(1 + priceIncrease / 100, 1 / 12);

    const entries: {
        monthYear: string;
        remainingDebt: number;
        housingValue: number;
        equity: number;
    }[] = [];

    for (let i = 0; i < maxPaymentsToShow; i++) {
        const row = amort.monthly[i];
        if (!row) break; // loan finished early

        // Format month
        const currentDate = new Date(start);
        currentDate.setMonth(start.getMonth() + i);

        const monthYear = currentDate.toLocaleString('no-NO', {
            month: 'short',
            year: 'numeric',
        });

        // Update housing value
        housingValue *= monthlyGrowthRate;

        const remainingDebt = row.balance;
        const equity = housingValue - remainingDebt;

        entries.push({
            monthYear,
            remainingDebt: Math.round(remainingDebt),
            housingValue: Math.round(housingValue),
            equity: Math.round(equity),
        });
    }

    return entries;
}
