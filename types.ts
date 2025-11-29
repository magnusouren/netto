export interface EconomyData {
    incomes: Income[];
    housingLoans: HousingLoan[];
    loans: Loan[];
    fixedExpenses: FixedExpense[];
    livingCosts: LivingCost[];
}

export type Income = {
    source: string;
    amount: number;
};

export type HousingLoan = Loan & {
    capital: number; // Egenkapital
};

export type Loan = {
    description: string;
    loanAmount: number; // Loan amount
    interestRate: number; // Annual interest rate in percentage
    termYears: number; // Loan term in years
    termsPerYear: number; // Number of payment terms per year
    monthlyFee?: number; // Optional monthly fee
};

export type FixedExpense = {
    description: string;
    amount: number;
    category: 'housing' | 'personal';
};

export type LivingCost = {
    description: string;
    amount: number;
};
