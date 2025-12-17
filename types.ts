export interface EconomyData {
    // global (same across houses)
    incomes: Income[];
    loans: Loan[]; // non-housing loans
    personalFixedExpenses: FixedExpense[]; // category: 'personal'
    livingCosts: LivingCost[];

    // global equity (cash / savings you can use as down payment)
    personalEquity: number;

    // house options
    houses: HouseOption[];
    activeHouseId: string;
}

export type HouseOption = {
    id: string;
    name: string; // e.g. "Nidarøy gate 10"
    purchase: {
        price: number;
        // how much of personalEquity you allocate to this purchase
        equityUsed: number;
        expectedGrowthPct?: number;
        // optional: closing costs (dokumentavgift, megler etc.)
        closingCosts?: number;
    };

    housingLoan: Loan; // loanAmount derived OR stored

    // depends on house
    houseMonthlyCosts: HouseMonthlyCosts;
};

export type HouseMonthlyCosts = {
    hoa?: number; // felleskost
    electricity?: number; // strøm
    internet?: number;
    insurance?: number; // innboforsikring/boligforsikring
    propertyTax?: number; // if monthly
    maintenance?: number; // vedlikehold buffer
    other?: number;
};

export type Income = {
    source: string;
    amount: number;
    taxFree?: boolean;
};

// Keep HousingLoan for migration compatibility
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
    startDate: string; // Optional start date in YYYY-MM-DD format
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

// Helper to create a default HouseOption
export function createDefaultHouseOption(id: string): HouseOption {
    return {
        id,
        name: 'Ny bolig',
        purchase: {
            price: 0,
            equityUsed: 0,
            expectedGrowthPct: 0,
            closingCosts: 0,
        },
        housingLoan: {
            description: 'Boliglån',
            loanAmount: 0,
            interestRate: 4.5,
            termYears: 25,
            termsPerYear: 12,
            monthlyFee: 0,
            startDate: new Date().toISOString().slice(0, 10),
        },
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
}

// Helper to get active house from data
export function getActiveHouse(data: EconomyData): HouseOption | undefined {
    return (data.houses || []).find((h) => h.id === data.activeHouseId);
}

// Helper to get all loans including active housing loan
export function getAllLoans(data: EconomyData): Loan[] {
    const activeHouse = getActiveHouse(data);
    const loans = [...data.loans];
    if (activeHouse) {
        loans.push(activeHouse.housingLoan);
    }
    return loans;
}

// Helper to get housing fixed expenses from active house
export function getHousingFixedExpenses(data: EconomyData): FixedExpense[] {
    const activeHouse = getActiveHouse(data);
    if (!activeHouse) return [];

    const costs = activeHouse.houseMonthlyCosts;
    const expenses: FixedExpense[] = [];

    if (costs.hoa)
        expenses.push({
            description: 'Felleskost',
            amount: costs.hoa,
            category: 'housing',
        });
    if (costs.electricity)
        expenses.push({
            description: 'Strøm',
            amount: costs.electricity,
            category: 'housing',
        });
    if (costs.internet)
        expenses.push({
            description: 'Internett',
            amount: costs.internet,
            category: 'housing',
        });
    if (costs.insurance)
        expenses.push({
            description: 'Forsikring',
            amount: costs.insurance,
            category: 'housing',
        });
    if (costs.propertyTax)
        expenses.push({
            description: 'Eiendomsskatt',
            amount: costs.propertyTax,
            category: 'housing',
        });
    if (costs.maintenance)
        expenses.push({
            description: 'Vedlikehold',
            amount: costs.maintenance,
            category: 'housing',
        });
    if (costs.other)
        expenses.push({
            description: 'Annet (bolig)',
            amount: costs.other,
            category: 'housing',
        });

    return expenses;
}

// Helper to get all fixed expenses (personal + housing from active house)
export function getAllFixedExpenses(data: EconomyData): FixedExpense[] {
    return [...data.personalFixedExpenses, ...getHousingFixedExpenses(data)];
}
