import { EconomyData, Loan, HouseMonthlyCosts } from '@/types';
import { calculateAnnualTaxes } from './calcTaxes';
import { computeLoanAmortization } from './amortization';

function totalHouseMonthlyCosts(costs: HouseMonthlyCosts): number {
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

export const generatePaymentPlan = (
    data: EconomyData,
    salaryAnnualGrowth: number,
    startDate: string,
    years = 30
) => {
    const incomes = data.incomes || [];

    // Get active house
    const activeHouse = (data.houses || []).find(
        (h) => h.id === data.activeHouseId
    );
    const housingLoan = activeHouse?.housingLoan;
    const loans: Loan[] = [
        ...(housingLoan ? [housingLoan] : []),
        ...(data.loans || []),
    ];

    // Fixed costs: housing from active house + personal fixed expenses + living costs
    const housingFixed = activeHouse
        ? totalHouseMonthlyCosts(activeHouse.houseMonthlyCosts)
        : 0;
    const personalFixed = (data.personalFixedExpenses || []).reduce(
        (s, f) => s + f.amount,
        0
    );
    const livingCosts = (data.livingCosts || []).reduce(
        (s, l) => s + l.amount,
        0
    );
    const baseFixedCosts = housingFixed + personalFixed + livingCosts;

    const start = new Date(startDate);
    start.setDate(1);
    const totalMonths = years * 12;

    // Precompute amortization for all loans
    const amortizations = loans.map((loan) => ({
        loan,
        startDate: new Date(loan.startDate),
        amort: computeLoanAmortization(loan),
    }));

    // Income setup
    let annualTaxableIncome = incomes
        .filter((i) => !i.taxFree)
        .reduce((s, i) => s + i.amount, 0);

    const annualTaxFreeIncome = incomes
        .filter((i) => i.taxFree)
        .reduce((s, i) => s + i.amount, 0);

    const rows = [];

    for (let i = 0; i < totalMonths; i++) {
        const date = new Date(start);
        date.setMonth(start.getMonth() + i);

        const monthStr = date.toLocaleString('no-NO', {
            year: 'numeric',
            month: 'short',
        });

        // salary raise in August
        if (date.getMonth() === 7 && i !== 0) {
            annualTaxableIncome *= 1 + salaryAnnualGrowth / 100;
        }

        const taxResult = calculateAnnualTaxes({
            ...data,
            incomes: [{ source: 'Taxable', amount: annualTaxableIncome }],
        });

        const monthlyIncome =
            taxResult.netMonthlyIncome + annualTaxFreeIncome / 12;

        let totalInterest = 0;
        let totalPrincipal = 0;
        let totalFees = 0;
        let housingPrincipal = 0;

        // pull exact loan month from amortization
        amortizations.forEach(({ loan, startDate, amort }) => {
            if (date < startDate) return;

            const monthIndex =
                (date.getFullYear() - startDate.getFullYear()) * 12 +
                (date.getMonth() - startDate.getMonth());

            const row = amort.monthly[monthIndex];
            if (!row) return; // loan ended

            totalInterest += row.interest;
            totalPrincipal += row.principal;
            totalFees += row.fee;

            // Check if this is the housing loan (first in the array if exists)
            if (housingLoan && loan === housingLoan) {
                housingPrincipal += row.principal;
            }
        });

        const loanCosts = totalInterest + totalPrincipal + totalFees;
        const expenses = baseFixedCosts + loanCosts;
        const balance = monthlyIncome - expenses;

        rows.push({
            month: monthStr,
            income: Math.round(monthlyIncome),
            expenses: Math.round(expenses),
            balance: Math.round(balance),
            totalInterest: Math.round(totalInterest),
            totalPrincipal: Math.round(totalPrincipal),
            balancePlusPrincipal: Math.round(balance + housingPrincipal),
        });
    }

    return rows;
};
