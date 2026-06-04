import {
    compressToEncodedURIComponent,
    decompressFromEncodedURIComponent,
} from 'lz-string';
import type { EconomyData } from '@/types';

export const SHARE_HASH_PREFIX = 'data=';
export const SHARE_PATH = '/del';

export function encodeShareData(data: EconomyData): string {
    return compressToEncodedURIComponent(JSON.stringify(data));
}

export function decodeShareData(payload: string): EconomyData | null {
    if (!payload) return null;
    let json: string | null = null;
    try {
        json = decompressFromEncodedURIComponent(payload);
    } catch {
        return null;
    }
    if (!json) return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(json);
    } catch {
        return null;
    }
    return isValidEconomyData(parsed) ? parsed : null;
}

export function isValidEconomyData(value: unknown): value is EconomyData {
    if (!value || typeof value !== 'object') return false;
    const v = value as Record<string, unknown>;
    return (
        Array.isArray(v.incomes) &&
        Array.isArray(v.loans) &&
        Array.isArray(v.personalFixedExpenses) &&
        Array.isArray(v.livingCosts) &&
        Array.isArray(v.houses) &&
        typeof v.personalEquity === 'number' &&
        typeof v.activeHouseId === 'string'
    );
}

export function buildShareUrl(data: EconomyData, origin?: string): string {
    const base =
        origin ??
        (typeof window !== 'undefined' ? window.location.origin : '');
    return `${base}${SHARE_PATH}#${SHARE_HASH_PREFIX}${encodeShareData(data)}`;
}

export function isDataEmpty(data: EconomyData): boolean {
    return (
        data.incomes.length === 0 &&
        data.loans.length === 0 &&
        data.personalFixedExpenses.length === 0 &&
        data.livingCosts.length === 0 &&
        data.houses.length === 0 &&
        data.personalEquity === 0
    );
}

export function readSharePayloadFromHash(hash: string): string | null {
    const stripped = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!stripped.startsWith(SHARE_HASH_PREFIX)) return null;
    const payload = stripped.slice(SHARE_HASH_PREFIX.length);
    return payload || null;
}
