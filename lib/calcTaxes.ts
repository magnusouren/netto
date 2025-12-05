import type { EconomyData, Loan } from '@/types';

/**
 * Calculates annual tax and returns:
 * - net annual income
 * - net monthly income
 * - total taxes
 * - all intermediate values
 */
export const calculateAnnualTaxes = (data: EconomyData) => {
    const incomes = data.incomes;
    const loansArr = data.loans;
    const housingLoans = data.housingLoans;

    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);

    // ----- Fradrag -----
    const minstefradrag = Math.min(totalIncome * 0.46, 92000);

    const loans: Loan[] = [...loansArr, ...housingLoans];

    // Årlige renter (for fradrag)
    const loanRows = loans.map((loan) => {
        const paidInterest =
            ((loan.loanAmount || 0) * (loan.interestRate || 0)) / 100;
        return {
            description: loan.description,
            paidInterest,
            taxDeduction: paidInterest * 0.22,
        };
    });

    const totalPaidInterest = loanRows.reduce((s, r) => s + r.paidInterest, 0);
    const totalInterestDeduction = loanRows.reduce(
        (s, r) => s + r.taxDeduction,
        0
    );

    const totalDeductions = minstefradrag + totalInterestDeduction;

    // ----- Skatteberegning -----
    const inntekt = totalIncome;
    const fradrag = totalDeductions;
    const alminnelig = Math.max(inntekt - fradrag, 0);

    const skatt_alminnelig = alminnelig * 0.1772;
    const trygdeavgift = inntekt * 0.077;

    const trinn1 = Math.max(Math.min(inntekt, 306050) - 217400, 0) * 0.017;
    const trinn2 = Math.max(Math.min(inntekt, 697150) - 306050, 0) * 0.04;
    const trinn3 = Math.max(Math.min(inntekt, 942400) - 697150, 0) * 0.137;
    const trinn4 = Math.max(Math.min(inntekt, 1410750) - 942400, 0) * 0.167;
    const trinn5 = Math.max(inntekt - 1410750, 0) * 0.177;

    const trinnskatt = trinn1 + trinn2 + trinn3 + trinn4 + trinn5;

    const totalTaxes = skatt_alminnelig + trygdeavgift + trinnskatt;
    const netAnnualIncome = totalIncome - totalTaxes;

    return {
        totalIncome,
        totalTaxes,
        netAnnualIncome,
        netMonthlyIncome: netAnnualIncome / 12,
        minstefradrag,
        totalPaidInterest,
        totalInterestDeduction,
        loanRows,
        skatt_alminnelig,
        trygdeavgift,
        trinnskatt,
        alminnelig,
        totalDeductions,
    };
};

export const calculateMonthlyTaxDistribution = (
    annualTaxes: number,
    currentDate: Date
) => {
    const month = currentDate.getMonth(); // 0 = Jan, 7 = Aug
    const monthsLeft = 12 - month;

    return annualTaxes / monthsLeft; // taxes spread across remaining months
};
