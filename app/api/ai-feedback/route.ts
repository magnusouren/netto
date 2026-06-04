import { NextResponse } from 'next/server';

const OPENAI_MODEL = 'gpt-4o-mini';

export type AIFeedbackRequest = {
    monthlyIncomeGross: number;
    monthlyTax: number;
    monthlyNet: number;
    personalFixed: number;
    livingMonthly: number;
    personalLoansMonthly: number;
    housingLoanMonthly: number;
    housingFixed: number;
    totalMonthlyExpenses: number;
    balance: number;
    activeHouseName?: string;
    personalEquity?: number;
    housePrice?: number;
    housingLoanAmount?: number;
};

export type AIFeedbackResponse = {
    feedback: string;
};

const fmt = (n: number) =>
    new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(
        Math.round(n)
    ) + ' kr';

const buildPrompt = (data: AIFeedbackRequest): string => {
    const lines: string[] = [
        `Brutto inntekt per måned: ${fmt(data.monthlyIncomeGross)}`,
        `Skatt per måned: ${fmt(data.monthlyTax)}`,
        `Netto inntekt per måned: ${fmt(data.monthlyNet)}`,
        '',
        `Faste personlige kostnader: ${fmt(data.personalFixed)}`,
        `Variable levekostnader: ${fmt(data.livingMonthly)}`,
        `Personlige lån (terminbeløp): ${fmt(data.personalLoansMonthly)}`,
    ];

    if (data.activeHouseName) {
        lines.push(
            '',
            `Aktiv bolig: ${data.activeHouseName}`,
            `Boliglån (terminbeløp): ${fmt(data.housingLoanMonthly)}`,
            `Faste boligkostnader: ${fmt(data.housingFixed)}`
        );
        if (typeof data.housePrice === 'number' && data.housePrice > 0) {
            lines.push(`Kjøpesum bolig: ${fmt(data.housePrice)}`);
        }
        if (
            typeof data.housingLoanAmount === 'number' &&
            data.housingLoanAmount > 0
        ) {
            lines.push(`Lånebeløp bolig: ${fmt(data.housingLoanAmount)}`);
        }
    }

    if (typeof data.personalEquity === 'number') {
        lines.push('', `Egenkapital: ${fmt(data.personalEquity)}`);
    }

    lines.push(
        '',
        `Sum utgifter per måned: ${fmt(data.totalMonthlyExpenses)}`,
        `Disponibelt per måned (netto inntekt − sum utgifter): ${fmt(data.balance)}`
    );

    return `Du er en nøktern norsk privatøkonomi-rådgiver. Brukeren har følgende månedsregnskap:

${lines.join('\n')}

Gi en kort, konkret vurdering av situasjonen på norsk (bokmål). Skriv 3–5 korte avsnitt eller punkter som dekker:
- En oppsummering av hovedinntrykket (sterke/svake sider)
- Hva som ser sunt ut
- Hva brukeren bør være oppmerksom på eller forbedre
- 1–2 konkrete forslag til neste steg

Vær direkte og tallnær, men ikke for lang. Ikke gjenta tallene ordrett – tolk dem. Ikke gi generelle forbehold om at du ikke er finansiell rådgiver.`;
};

const fetchOpenAIFeedback = async (
    prompt: string,
    apiKey: string
): Promise<string> => {
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
                        'Du er en nøktern norsk privatøkonomi-rådgiver som svarer på bokmål.',
                },
                { role: 'user', content: prompt },
            ],
            temperature: 0.5,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
            `[ai-feedback] OpenAI failed with status ${response.status}: ${errorText}`
        );
    }

    const json = (await response.json()) as {
        choices?: { message?: { content?: string } }[];
    };

    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) {
        throw new Error('[ai-feedback] OpenAI response did not include content');
    }
    return content;
};

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value);

const validatePayload = (raw: unknown): AIFeedbackRequest | null => {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const required: (keyof AIFeedbackRequest)[] = [
        'monthlyIncomeGross',
        'monthlyTax',
        'monthlyNet',
        'personalFixed',
        'livingMonthly',
        'personalLoansMonthly',
        'housingLoanMonthly',
        'housingFixed',
        'totalMonthlyExpenses',
        'balance',
    ];
    for (const key of required) {
        if (!isFiniteNumber(r[key])) return null;
    }
    return {
        monthlyIncomeGross: r.monthlyIncomeGross as number,
        monthlyTax: r.monthlyTax as number,
        monthlyNet: r.monthlyNet as number,
        personalFixed: r.personalFixed as number,
        livingMonthly: r.livingMonthly as number,
        personalLoansMonthly: r.personalLoansMonthly as number,
        housingLoanMonthly: r.housingLoanMonthly as number,
        housingFixed: r.housingFixed as number,
        totalMonthlyExpenses: r.totalMonthlyExpenses as number,
        balance: r.balance as number,
        activeHouseName:
            typeof r.activeHouseName === 'string' ? r.activeHouseName : undefined,
        personalEquity: isFiniteNumber(r.personalEquity)
            ? r.personalEquity
            : undefined,
        housePrice: isFiniteNumber(r.housePrice) ? r.housePrice : undefined,
        housingLoanAmount: isFiniteNumber(r.housingLoanAmount)
            ? r.housingLoanAmount
            : undefined,
    };
};

export async function POST(request: Request) {
    try {
        const raw = await request.json();
        const payload = validatePayload(raw);

        if (!payload) {
            return NextResponse.json(
                { error: 'Ugyldig data for AI-tilbakemelding.' },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OPENAI_API_KEY er ikke konfigurert på serveren.' },
                { status: 500 }
            );
        }

        const prompt = buildPrompt(payload);
        const feedback = await fetchOpenAIFeedback(
            prompt,
            process.env.OPENAI_API_KEY
        );

        return NextResponse.json(
            { feedback } satisfies AIFeedbackResponse,
            {
                headers: { 'Cache-Control': 'no-store' },
            }
        );
    } catch (error) {
        console.error('[ai-feedback] Failed to generate feedback', error);
        return NextResponse.json(
            { error: 'Kunne ikke hente AI-tilbakemelding akkurat nå.' },
            { status: 500 }
        );
    }
}
