import { NextResponse } from 'next/server';
import type { HouseOption } from '@/types';

type FinnRequestBody = {
    url?: string;
};

type ExtractedHouseFields = {
    name?: string;
    price?: number | string;
    closingCosts?: number | string;
    commonDebt?: number | string;
    hoa?: number | string;
    propertyTax?: number | string;
    insurance?: number | string;
    maintenance?: number | string;
    electricity?: number | string;
    internet?: number | string;
    other?: number | string;
    expectedGrowthPct?: number | string;
};

const MAX_CONTEXT_CHARACTERS = 16000;
const OPENAI_MODEL = 'gpt-4o-mini';

const isValidFinnUrl = (value?: string): value is string => {
    if (!value) return false;

    try {
        const parsed = new URL(value);
        return parsed.hostname.includes('finn.no');
    } catch (error) {
        console.error('[finn] Invalid URL supplied', error);
        return false;
    }
};

const sanitizeHtmlForPrompt = (html: string): string => {
    const withoutScripts = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ');

    const withoutMarkup = withoutScripts
        .replace(/<!--.*?-->/gs, ' ')
        .replace(/<[^>]+>/g, ' ');

    const normalized = withoutMarkup.replace(/\s+/g, ' ').trim();

    return normalized.slice(0, MAX_CONTEXT_CHARACTERS);
};

const toAmount = (value?: number | string): number => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return Math.round(value);
    }

    if (!value) return 0;

    const numeric = String(value).replace(/[^\d]/g, '');
    const parsed = Number(numeric);

    return Number.isFinite(parsed) ? parsed : 0;
};

const buildHouseFromExtraction = (
    extraction: ExtractedHouseFields
): HouseOption => {
    const price = toAmount(extraction.price);
    const closingCosts = toAmount(extraction.closingCosts);
    const commonDebt = toAmount(extraction.commonDebt);
    const expectedGrowthPct = Number(extraction.expectedGrowthPct ?? 2);

    const monthlyCosts = {
        hoa: toAmount(extraction.hoa),
        electricity: toAmount(extraction.electricity),
        internet: toAmount(extraction.internet),
        insurance: toAmount(extraction.insurance),
        propertyTax: toAmount(extraction.propertyTax),
        maintenance: toAmount(extraction.maintenance),
        other: toAmount(extraction.other),
    } satisfies HouseOption['houseMonthlyCosts'];

    // TODO - common debt as own field?
    const purchase = {
        price,
        equityUsed: 0,
        expectedGrowthPct: Number.isFinite(expectedGrowthPct)
            ? expectedGrowthPct
            : 2,
        closingCosts: closingCosts + commonDebt,
    } satisfies HouseOption['purchase'];

    const loanAmount = price - purchase.equityUsed + closingCosts;

    return {
        id: crypto.randomUUID(),
        name: extraction.name?.trim() || 'Finn-bolig',
        purchase,
        housingLoan: {
            description: 'Boliglån',
            loanAmount: loanAmount > 0 ? loanAmount : 0,
            interestRate: 4.5,
            termYears: 25,
            termsPerYear: 12,
            startDate: new Date().toISOString().slice(0, 10),
        },
        houseMonthlyCosts: monthlyCosts,
    };
};

const buildPrompt = (context: string, url: string) => `
Du er en eiendomsanalytiker som leser rå HTML-tekst fra en FINN-annonse for bolig.
Du skal hente ut økonomiske tall i norske kroner (NOK) og returnere kun JSON.

Følgende felter skal fylles ut (bruk 0 dersom feltet mangler):
- name: annonsetittel eller adresse, uten postnummer og sted.
- price: prisantydning eller totalpris eksklusive fellesgjeld.
- closingCosts: summer omkostninger.
- commonDebt: fellesgjeld hvis oppgitt separat (ellers 0).
- hoa: felleskostnader per måned.
- propertyTax: eiendomsskatt/kommunale avgifter per måned (del opp årlig beløp på 12 hvis kun årlig tall finnes).
- insurance: månedlige forsikringskostnader hvis oppgitt.
- internet: månedlig kostnad for internett/bredbånd hvis oppgitt.
- electricity: estimert månedlig strøm.
- maintenance: månedlig vedlikehold eller oppgraderingskostnader hvis oppgitt.
- other: andre månedlige boligkostnader.
- expectedGrowthPct: forventet årlig prisvekst i prosent (bruk 2 hvis ikke oppgitt).

Returner kun ett JSON-objekt med disse feltene. Bruk heltall uten tusenskilletegn og uten valutategn.
Kilde-URL: ${url}

HTML-innhold (trunkert):
${context}`;

const extractWithOpenAI = async (
    prompt: string,
    apiKey: string
): Promise<ExtractedHouseFields> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: OPENAI_MODEL,
            messages: [
                {
                    role: 'system',
                    content:
                        'Du er en presis strukturert data-uttrekksmodell som svarer med gyldig JSON.',
                },
                { role: 'user', content: prompt },
            ],
            response_format: { type: 'json_object' },
            temperature: 0,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `[finn] OpenAI extraction failed with status ${response.status}: ${errorText}`
        );
    }

    const json = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
    };

    const content = json.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('[finn] OpenAI response did not include content');
    }

    try {
        return JSON.parse(content) as ExtractedHouseFields;
    } catch (error) {
        console.error('[finn] Failed to parse OpenAI JSON', error, content);
        throw error;
    }
};

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as FinnRequestBody;

        if (!isValidFinnUrl(body.url)) {
            return NextResponse.json(
                { error: 'Ugyldig FINN-lenke. Lim inn en URL fra finn.no.' },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                {
                    error: 'OPENAI_API_KEY er ikke konfigurert på serveren.',
                },
                { status: 500 }
            );
        }

        const finnResponse = await fetch(body.url, {
            cache: 'no-store',
            headers: {
                'User-Agent': 'netto-ai-fetcher/1.0',
            },
        });

        if (!finnResponse.ok) {
            return NextResponse.json(
                { error: 'Klarte ikke å hente annonsen fra finn.no' },
                { status: 502 }
            );
        }

        const html = await finnResponse.text();
        const prompt = buildPrompt(sanitizeHtmlForPrompt(html), body.url);
        const extracted = await extractWithOpenAI(
            prompt,
            process.env.OPENAI_API_KEY
        );

        const house = buildHouseFromExtraction(extracted);

        return NextResponse.json(
            { house },
            {
                headers: {
                    'Cache-Control': 'no-store',
                },
            }
        );
    } catch (error) {
        console.error('[finn] Failed to fetch or parse listing', error);
        return NextResponse.json(
            {
                error: 'Kunne ikke hente boligdata automatisk akkurat nå. Prøv igjen senere.',
            },
            { status: 500 }
        );
    }
}
