import type { EconomyData, Loan } from '@/types';
import { computeLoanAmortization } from './amortization';

/**
 * Helper to get the active house's housing loan from EconomyData
 */
function getActiveHousingLoan(data: EconomyData): Loan | null {
    const activeHouse = (data.houses || []).find(
        (h) => h.id === data.activeHouseId
    );
    return activeHouse?.housingLoan ?? null;
}

/**
 * Calculates annual taxes using real amortization interest.
 */
export const calculateAnnualTaxes = (data: EconomyData) => {
    const incomes = data.incomes;

    // ------ TAXABLE INCOME ------
    const totalIncome = incomes
        .filter((inc) => !inc.taxFree)
        .reduce((sum, inc) => sum + inc.amount, 0);

    const taxFreeIncome = incomes
        .filter((inc) => inc.taxFree)
        .reduce((sum, inc) => sum + inc.amount, 0);

    // ------ REAL INTEREST DEDUCTION ------
    // Combine regular loans with the active house's housing loan
    const housingLoan = getActiveHousingLoan(data);
    const allLoans: Loan[] = [
        ...data.loans,
        ...(housingLoan ? [housingLoan] : []),
    ];

    let totalPaidInterest = 0;

    allLoans.forEach((loan) => {
        const amort = computeLoanAmortization(loan);

        // Only take 12 months of interest for tax purpose
        const loanAnnualInterest = amort.monthly
            .slice(0, 12)
            .reduce((s, r) => s + r.interest, 0);

        totalPaidInterest += loanAnnualInterest;
    });

    const totalInterestDeduction = totalPaidInterest * 0.22; // Skattefradrag

    // ------ MINSTEFRADRAG ------
    const minstefradrag = Math.min(totalIncome * 0.46, 92000);

    const totalDeductions = minstefradrag + totalInterestDeduction;

    // ------ ALMINNELIG INNTEKT ------
    const alminnelig = Math.max(totalIncome - totalDeductions, 0);

    const skatt_alminnelig = alminnelig * 0.1772;
    const trygdeavgift = totalIncome * 0.077;

    // ------ TRINNSKATT ------
    const trinn1 = Math.max(Math.min(totalIncome, 306050) - 217400, 0) * 0.017;
    const trinn2 = Math.max(Math.min(totalIncome, 697150) - 306050, 0) * 0.04;
    const trinn3 = Math.max(Math.min(totalIncome, 942400) - 697150, 0) * 0.137;
    const trinn4 = Math.max(Math.min(totalIncome, 1410750) - 942400, 0) * 0.167;
    const trinn5 = Math.max(totalIncome - 1410750, 0) * 0.177;

    const trinnskatt = trinn1 + trinn2 + trinn3 + trinn4 + trinn5;

    const totalTaxes = skatt_alminnelig + trygdeavgift + trinnskatt;
    const netAnnualIncome = totalIncome - totalTaxes;
    const netMonthlyIncome = netAnnualIncome / 12;

    const effectiveTaxRate =
        totalIncome > 0 ? (totalTaxes / totalIncome) * 100 : 0;

    return {
        totalIncome,
        netAnnualIncome,
        netMonthlyIncome,
        totalTaxes,

        // Deductions
        minstefradrag,
        totalPaidInterest,
        totalInterestDeduction,
        totalDeductions,
        alminnelig,

        // Components
        skatt_alminnelig,
        trygdeavgift,
        trinnskatt,

        effectiveTaxRate,
    };
};
