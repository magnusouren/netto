import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Månedlig økonomi',
    description:
        'Månedlig kontantstrøm over tid med inntekter, utgifter, lån og balanse. Justerbar lønnsvekst og startdato.',
};

export default function MonthlyEconomyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
