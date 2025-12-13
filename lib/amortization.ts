export interface AmortizationMonthly {
    term: number;
    date: string;
    payment: number;
    interest: number;
    principal: number;
    fee: number;
    balance: number;
}

export interface AmortizationYearGroup {
    year: number;
    totalInterest: number;
    totalPrincipal: number;
    totalFees: number;
    totalPaid: number;
    endBalance: number;
}

export interface AmortizationTotals {
    totalInterest: number;
    totalPrincipal: number;
    totalFees: number;
    totalPaid: number;
}

export interface AmortizationResult {
    monthly: AmortizationMonthly[];
    first12Months: AmortizationMonthly[];
    yearGroups: AmortizationYearGroup[];
    totals: AmortizationTotals;
}

const MONTH_LABELS = [
    'jan',
    'feb',
    'mar',
    'apr',
    'mai',
    'jun',
    'jul',
    'aug',
    'sep',
    'okt',
    'nov',
    'des',
];

function formatMonthYear(date: Date) {
    const month = MONTH_LABELS[date.getMonth()] ?? '';
    return `${month} ${date.getFullYear()}`;
}

export function computeLoanAmortization(loan: {
    loanAmount: number;
    interestRate: number;
    termYears: number;
    termsPerYear: number;
    monthlyFee?: number;
    startDate: string;
}): AmortizationResult {
    const {
        loanAmount,
        interestRate,
        termYears,
        termsPerYear,
        monthlyFee = 0,
        startDate,
    } = loan;

    const numberOfTerms = termYears * termsPerYear;
    const ratePerTerm = interestRate / 100 / termsPerYear;

    const termPayment =
        (loanAmount * ratePerTerm) /
        (1 - Math.pow(1 + ratePerTerm, -numberOfTerms));

    let balance = loanAmount;

    const monthly: AmortizationMonthly[] = [];
    const first12Months: AmortizationMonthly[] = [];
    const yearGroups: AmortizationYearGroup[] = [];

    let currentDate = new Date(startDate);
    currentDate.setDate(1);

    const addMonths = (d: Date, n: number) =>
        new Date(d.getFullYear(), d.getMonth() + n, d.getDate());

    let yearInterest = 0;
    let yearPrincipal = 0;
    let yearFees = 0;
    let yearPaid = 0;

    for (let term = 1; term <= numberOfTerms; term++) {
        const interest = balance * ratePerTerm;
        const principal = Math.min(termPayment - interest, balance);
        balance -= principal;

        const payment = principal + interest + monthlyFee;

        const formattedDate = formatMonthYear(currentDate);

        const row: AmortizationMonthly = {
            term,
            date: formattedDate,
            payment,
            interest,
            principal,
            fee: monthlyFee,
            balance,
        };

        monthly.push(row);

        if (term <= 12) {
            first12Months.push(row);
        }

        // year aggregation
        const thisYear = currentDate.getFullYear();
        yearInterest += interest;
        yearPrincipal += principal;
        yearFees += monthlyFee;
        yearPaid += payment;

        const nextDate = addMonths(currentDate, 1);
        const nextYear = nextDate.getFullYear();

        if (nextYear !== thisYear || term === numberOfTerms) {
            yearGroups.push({
                year: thisYear,
                totalInterest: yearInterest,
                totalPrincipal: yearPrincipal,
                totalFees: yearFees,
                totalPaid: yearPaid,
                endBalance: balance,
            });

            yearInterest = 0;
            yearPrincipal = 0;
            yearFees = 0;
            yearPaid = 0;
        }

        currentDate = nextDate;
    }

    const totals = yearGroups.reduce(
        (acc, y) => {
            acc.totalInterest += y.totalInterest;
            acc.totalPrincipal += y.totalPrincipal;
            acc.totalFees += y.totalFees;
            acc.totalPaid += y.totalPaid;
            return acc;
        },
        {
            totalInterest: 0,
            totalPrincipal: 0,
            totalFees: 0,
            totalPaid: 0,
        }
    );

    return {
        monthly,
        first12Months,
        yearGroups,
        totals,
    };
}
