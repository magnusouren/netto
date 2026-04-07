import type { EconomyData, Loan } from '@/types';
import { computeLoanAmortization } from './amortization';

/**
 * Helper to get the active house's housing loan from EconomyData
 */
function getActiveHousingLoan(data: EconomyData): Loan | null {
    const activeHouse = (data.houses || []).find(
        (h) => h.id === data.activeHouseId,
    );
    return activeHouse?.housingLoan ?? null;
}

const TAX_YEAR_2026 = {
    minstefradragRate: 0.46,
    minstefradragMax: 95700,
    personfradrag: 114540,
    alminneligSkattRate: 0.22,

    trygdeavgift: {
        lonnRate: 0.076,
        nedreGrense: 99650,
        opptrappingRate: 0.25,
    },

    trinnskatt: [
        { lower: 226100, upper: 318300, rate: 0.017 },
        { lower: 318300, upper: 725050, rate: 0.04 },
        { lower: 725050, upper: 980100, rate: 0.137 },
        { lower: 980100, upper: 1467200, rate: 0.168 },
        { lower: 1467200, upper: Infinity, rate: 0.178 },
    ],
} as const;

const roundNOK = (value: number) => Math.round(value);

const calculateBracketTax = (
    income: number,
    lower: number,
    upper: number,
    rate: number,
) => {
    const taxableAmount = Math.max(Math.min(income, upper) - lower, 0);
    return roundNOK(taxableAmount * rate);
};

const calculateTrygdeavgift = (personalIncome: number) => {
    const { lonnRate, nedreGrense, opptrappingRate } =
        TAX_YEAR_2026.trygdeavgift;

    if (personalIncome <= nedreGrense) {
        return 0;
    }

    const ordinærAvgift = personalIncome * lonnRate;
    const opptrappingstak = (personalIncome - nedreGrense) * opptrappingRate;

    return roundNOK(Math.min(ordinærAvgift, opptrappingstak));
};

export const calculateAnnualTaxes = (data: EconomyData) => {
    const incomes = data.incomes;

    // ------ TAXABLE INCOME ------
    const totalIncome = roundNOK(
        incomes
            .filter((inc) => !inc.taxFree)
            .reduce((sum, inc) => sum + inc.amount, 0),
    );

    const taxFreeIncome = roundNOK(
        incomes
            .filter((inc) => inc.taxFree)
            .reduce((sum, inc) => sum + inc.amount, 0),
    );

    // ------ REAL INTEREST DEDUCTION ------
    const housingLoan = getActiveHousingLoan(data);
    const allLoans: Loan[] = [
        ...data.loans,
        ...(housingLoan ? [housingLoan] : []),
    ];

    const totalPaidInterest = roundNOK(
        allLoans.reduce((loanSum, loan) => {
            const amort = computeLoanAmortization(loan);

            const loanAnnualInterest = amort.monthly
                .slice(0, 12)
                .reduce((s, r) => s + r.interest, 0);

            return loanSum + loanAnnualInterest;
        }, 0),
    );

    const allLoansInterestDetails = allLoans.map((loan) => {
        const amort = computeLoanAmortization(loan);
        const loanAnnualInterest = amort.monthly
            .slice(0, 12)
            .reduce((s, r) => s + r.interest, 0);

        return {
            description: loan.description,
            annualInterest: roundNOK(loanAnnualInterest),
        };
    });

    // Viktig:
    // I selve skatteberegningen skal renter trekkes fra inntekten med fullt beløp.
    // Skatteverdien av dette blir automatisk 22 % gjennom beregningen av skatt på alminnelig inntekt.
    const totalInterestDeduction = totalPaidInterest;

    // ------ MINSTEFRADRAG ------
    const minstefradrag = roundNOK(
        Math.min(
            totalIncome * TAX_YEAR_2026.minstefradragRate,
            TAX_YEAR_2026.minstefradragMax,
        ),
    );

    const totalDeductions = roundNOK(minstefradrag + totalInterestDeduction);

    // ------ ALMINNELIG INNTEKT ------
    const alminnelig = roundNOK(Math.max(totalIncome - totalDeductions, 0));

    // ------ PERSONFRADRAG ------
    const skattegrunnlagAlminnelig = roundNOK(
        Math.max(alminnelig - TAX_YEAR_2026.personfradrag, 0),
    );

    const skatt_alminnelig = roundNOK(
        skattegrunnlagAlminnelig * TAX_YEAR_2026.alminneligSkattRate,
    );

    // ------ EFFEKT AV FRADRAG ------
    const minstefradragTaxValue = roundNOK(minstefradrag * 0.22);
    const interestTaxValue = roundNOK(totalPaidInterest * 0.22);

    // ------ TRYGDEAVGIFT ------
    const trygdeavgift = calculateTrygdeavgift(totalIncome);

    // ------ TRINNSKATT ------
    const trinnskattDetails = TAX_YEAR_2026.trinnskatt.map((bracket) =>
        calculateBracketTax(
            totalIncome,
            bracket.lower,
            bracket.upper,
            bracket.rate,
        ),
    );

    const trinnskatt = roundNOK(
        trinnskattDetails.reduce((sum, value) => sum + value, 0),
    );

    // ------ TOTALS ------
    const totalTaxes = roundNOK(skatt_alminnelig + trygdeavgift + trinnskatt);

    const netAnnualIncome = roundNOK(totalIncome + taxFreeIncome - totalTaxes);

    const netMonthlyIncome = roundNOK(netAnnualIncome / 12);

    const effectiveTaxRate =
        totalIncome > 0 ? (totalTaxes / totalIncome) * 100 : 0;

    return {
        totalIncome,
        netAnnualIncome,
        netMonthlyIncome,
        totalTaxes,

        // Renter
        allLoansInterestDetails,

        // Deductions
        minstefradrag,
        totalPaidInterest,
        totalInterestDeduction,
        totalDeductions,
        alminnelig,

        // Effekten av fradrag
        minstefradragTaxValue,
        interestTaxValue,
        totalFradragTaxValue: roundNOK(
            minstefradragTaxValue + interestTaxValue,
        ),

        // Components
        skatt_alminnelig,
        trygdeavgift,
        trinnskatt,

        effectiveTaxRate,
    };
};
