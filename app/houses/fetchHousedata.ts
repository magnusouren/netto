import type { HouseOption } from '@/types';

type FinnApiSuccess = { house: HouseOption };
type FinnApiError = { error: string };

type FinnApiResponse = FinnApiSuccess | FinnApiError;

const isFinnApiError = (v: FinnApiResponse): v is FinnApiError =>
    typeof (v as FinnApiError)?.error === 'string';

export async function autoFetchHouseData(
    url: string,
    opts?: {
        signal?: AbortSignal;
        timeoutMs?: number;
    }
): Promise<HouseOption> {
    const timeoutMs = opts?.timeoutMs ?? 20_000;

    const controller = new AbortController();
    const onAbort = () => controller.abort();

    // If caller provided a signal, forward abort into our controller
    if (opts?.signal) {
        if (opts.signal.aborted) controller.abort();
        else opts.signal.addEventListener('abort', onAbort, { once: true });
    }

    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const res = await fetch('/api/finn', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
            signal: controller.signal,
        });

        // Try to parse JSON even on non-2xx (your API returns JSON errors)
        let data: FinnApiResponse;
        try {
            data = (await res.json()) as FinnApiResponse;
        } catch {
            throw new Error(
                res.ok
                    ? 'Ugyldig svar fra server (ikke JSON).'
                    : `Serverfeil (${res.status}).`
            );
        }

        if (!res.ok) {
            const msg = isFinnApiError(data)
                ? data.error
                : `Serverfeil (${res.status}).`;
            throw new Error(msg);
        }

        if (isFinnApiError(data)) {
            throw new Error(data.error);
        }

        return data.house;
    } catch (err) {
        // Make AbortError friendlier
        if (err instanceof DOMException && err.name === 'AbortError') {
            throw new Error(
                'Forespørselen ble avbrutt eller tok for lang tid.'
            );
        }
        throw err;
    } finally {
        clearTimeout(timeoutId);
        if (opts?.signal) opts.signal.removeEventListener('abort', onAbort);
    }
}
