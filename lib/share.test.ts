import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    SHARE_HASH_PREFIX,
    SHARE_PATH,
    buildShareUrl,
    decodeShareData,
    encodeShareData,
    isDataEmpty,
    isValidEconomyData,
    readSharePayloadFromHash,
} from './share';
import type { EconomyData } from '../types';

const emptyData: EconomyData = {
    incomes: [],
    loans: [],
    personalFixedExpenses: [],
    livingCosts: [],
    personalEquity: 0,
    houses: [],
    activeHouseId: '',
};

const sampleData: EconomyData = {
    incomes: [
        { source: 'Lønn', amount: 750_000 },
        { source: 'Aksjeutbytte', amount: 30_000, taxFree: false },
    ],
    loans: [
        {
            description: 'Studielån',
            loanAmount: 250_000,
            interestRate: 3.5,
            termYears: 15,
            termsPerYear: 12,
            startDate: '2024-01-01',
        },
    ],
    personalFixedExpenses: [
        { description: 'Mobil', amount: 399, category: 'personal' },
    ],
    livingCosts: [{ description: 'Mat', amount: 5_500 }],
    personalEquity: 400_000,
    houses: [
        {
            id: 'house-1',
            name: 'Nidarøy gate 10',
            purchase: {
                price: 4_200_000,
                equityUsed: 600_000,
                expectedGrowthPct: 3,
                closingCosts: 100_000,
                commonDebt: 0,
            },
            housingLoan: {
                description: 'Boliglån',
                loanAmount: 3_700_000,
                interestRate: 5.2,
                termYears: 25,
                termsPerYear: 12,
                monthlyFee: 50,
                startDate: '2026-01-01',
            },
            houseMonthlyCosts: {
                hoa: 3_500,
                electricity: 800,
                internet: 500,
            },
        },
    ],
    activeHouseId: 'house-1',
};

describe('encodeShareData / decodeShareData round-trip', () => {
    it('preserves a full EconomyData object', () => {
        const encoded = encodeShareData(sampleData);
        const decoded = decodeShareData(encoded);
        assert.deepEqual(decoded, sampleData);
    });

    it('preserves an empty EconomyData object', () => {
        const encoded = encodeShareData(emptyData);
        const decoded = decodeShareData(encoded);
        assert.deepEqual(decoded, emptyData);
    });

    it('produces URL-safe output (no #, &, =, /, ?)', () => {
        const encoded = encodeShareData(sampleData);
        assert.ok(
            /^[A-Za-z0-9_\-$+]*$/.test(encoded),
            `encoded payload contained unsafe chars: ${encoded}`
        );
    });
});

describe('decodeShareData with invalid input', () => {
    it('returns null on empty string', () => {
        assert.equal(decodeShareData(''), null);
    });

    it('returns null on garbage payload', () => {
        assert.equal(decodeShareData('not-valid-lz!!!'), null);
    });

    it('returns null when the decoded JSON is not EconomyData-shaped', () => {
        // Encode something that is valid JSON but wrong shape.
        const wrong = encodeShareData({ foo: 'bar' } as unknown as EconomyData);
        assert.equal(decodeShareData(wrong), null);
    });
});

describe('isValidEconomyData', () => {
    it('accepts a valid EconomyData object', () => {
        assert.equal(isValidEconomyData(sampleData), true);
        assert.equal(isValidEconomyData(emptyData), true);
    });

    it('rejects null, undefined, primitives', () => {
        assert.equal(isValidEconomyData(null), false);
        assert.equal(isValidEconomyData(undefined), false);
        assert.equal(isValidEconomyData(42), false);
        assert.equal(isValidEconomyData('hello'), false);
    });

    it('rejects an empty object', () => {
        assert.equal(isValidEconomyData({}), false);
    });

    it('rejects objects missing array fields', () => {
        const partial = { ...emptyData, incomes: 'oops' };
        assert.equal(isValidEconomyData(partial), false);
    });

    it('rejects objects with wrong personalEquity type', () => {
        const partial = { ...emptyData, personalEquity: '0' };
        assert.equal(isValidEconomyData(partial), false);
    });
});

describe('isDataEmpty', () => {
    it('returns true for the default empty data', () => {
        assert.equal(isDataEmpty(emptyData), true);
    });

    it('returns false when any field has content', () => {
        assert.equal(isDataEmpty(sampleData), false);
        assert.equal(
            isDataEmpty({ ...emptyData, personalEquity: 100 }),
            false
        );
        assert.equal(
            isDataEmpty({
                ...emptyData,
                incomes: [{ source: 'x', amount: 1 }],
            }),
            false
        );
    });
});

describe('buildShareUrl', () => {
    it('uses the explicit origin when provided', () => {
        const url = buildShareUrl(sampleData, 'https://netto.example');
        assert.ok(url.startsWith(`https://netto.example${SHARE_PATH}#${SHARE_HASH_PREFIX}`));
    });

    it('payload from buildShareUrl decodes back to the original data', () => {
        const url = buildShareUrl(sampleData, 'https://netto.example');
        const hash = url.slice(url.indexOf('#'));
        const payload = readSharePayloadFromHash(hash);
        assert.ok(payload);
        assert.deepEqual(decodeShareData(payload!), sampleData);
    });
});

describe('readSharePayloadFromHash', () => {
    it('extracts the payload after #data=', () => {
        assert.equal(readSharePayloadFromHash('#data=abc123'), 'abc123');
    });

    it('handles a hash without the leading #', () => {
        assert.equal(readSharePayloadFromHash('data=abc123'), 'abc123');
    });

    it('returns null when prefix is missing', () => {
        assert.equal(readSharePayloadFromHash('#other=abc'), null);
        assert.equal(readSharePayloadFromHash(''), null);
    });

    it('returns null when the payload is empty', () => {
        assert.equal(readSharePayloadFromHash('#data='), null);
    });
});
