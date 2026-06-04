import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    computeHousingLoanAmount,
    totalPurchasePrice,
} from './houseFinance';

describe('computeHousingLoanAmount', () => {
    it('returns price + closingCosts - equityUsed', () => {
        assert.equal(
            computeHousingLoanAmount({
                price: 4_000_000,
                closingCosts: 100_000,
                equityUsed: 600_000,
            }),
            3_500_000
        );
    });

    it('clamps to 0 when equity exceeds price + closingCosts', () => {
        assert.equal(
            computeHousingLoanAmount({
                price: 1_000_000,
                closingCosts: 50_000,
                equityUsed: 2_000_000,
            }),
            0
        );
    });

    it('ignores commonDebt (fellesgjeld is not financed by the mortgage)', () => {
        const withDebt = computeHousingLoanAmount({
            price: 4_000_000,
            closingCosts: 100_000,
            equityUsed: 600_000,
            // @ts-expect-error commonDebt is intentionally not part of the signature
            commonDebt: 500_000,
        });
        const withoutDebt = computeHousingLoanAmount({
            price: 4_000_000,
            closingCosts: 100_000,
            equityUsed: 600_000,
        });
        assert.equal(withDebt, withoutDebt);
        assert.equal(withDebt, 3_500_000);
    });

    it('treats missing optional fields as 0', () => {
        assert.equal(computeHousingLoanAmount({ price: 1_000_000 }), 1_000_000);
        assert.equal(computeHousingLoanAmount({}), 0);
    });
});

describe('totalPurchasePrice', () => {
    it('sums price, closingCosts and commonDebt', () => {
        assert.equal(
            totalPurchasePrice({
                price: 4_000_000,
                closingCosts: 100_000,
                commonDebt: 500_000,
            }),
            4_600_000
        );
    });

    it('tolerates missing optional fields', () => {
        assert.equal(totalPurchasePrice({ price: 1_000_000 }), 1_000_000);
        assert.equal(totalPurchasePrice({}), 0);
    });
});
