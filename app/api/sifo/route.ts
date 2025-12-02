import { NextResponse } from 'next/server';

export type SifoRequestBody = {
    select_year: string;
    inntekt: string;
    antall_biler: string;
    antall_elbiler: string;
    kjonn0: 'm' | 'k';
    alder0: string;
    barnehage0: string;
    sfo0: string;
    sfogratis0: string;
    gravid0: string;
    student0: string;
    pensjonist0: string;
    lang: 'no' | 'en';
};

export type SifoResponse = {
    utgifter: {
        individspesifikke: Record<string, number>;
        husholdsspesifikke: Record<string, number>;
    };
    utgifterBeskrivelser: {
        individspesifikke: Record<string, { beskrivelse: string }>;
        husholdsspesifikke: Record<string, { beskrivelse: string }>;
    };
};

const normalizeNumberInput = (value: unknown) => {
    const parsed = Number(value);

    if (!Number.isFinite(parsed) || parsed < 0) {
        return '0';
    }

    return Math.trunc(parsed).toString();
};

const parseBudgetResponse = (body: string): SifoResponse => {
    try {
        return JSON.parse(body) as SifoResponse;
    } catch (error) {
        const start = body.indexOf('{');
        const end = body.lastIndexOf('}');

        if (start !== -1 && end !== -1 && end > start) {
            return JSON.parse(body.slice(start, end + 1)) as SifoResponse;
        }

        throw error;
    }
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as Partial<SifoRequestBody>;

        const normalized: SifoRequestBody = {
            select_year: body.select_year ?? '2025',
            inntekt: normalizeNumberInput(body.inntekt),
            antall_biler: normalizeNumberInput(body.antall_biler),
            antall_elbiler: normalizeNumberInput(body.antall_elbiler),
            kjonn0: body.kjonn0 === 'k' ? 'k' : 'm',
            alder0: normalizeNumberInput(body.alder0),
            barnehage0: normalizeNumberInput(body.barnehage0),
            sfo0: normalizeNumberInput(body.sfo0),
            sfogratis0: normalizeNumberInput(body.sfogratis0),
            gravid0: normalizeNumberInput(body.gravid0),
            student0: normalizeNumberInput(body.student0),
            pensjonist0: normalizeNumberInput(body.pensjonist0),
            // The API expects "lang=no"; other variants trigger PHP notices
            lang: 'no',
        };

        const params = new URLSearchParams(normalized);

        const response = await fetch(
            `https://kalkulator.referansebudsjett.no/php/resultat_as_json.php?${params.toString()}`,
            {
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Klarte ikke å hente levekostnader fra referansebudsjettet' },
                { status: 502 }
            );
        }

        const parsed = parseBudgetResponse(await response.text());

        return NextResponse.json(parsed, {
            headers: {
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('[sifo] Failed to fetch budget', error);
        return NextResponse.json(
            { error: 'Ukjent feil ved henting av budsjett' },
            { status: 500 }
        );
    }
}
