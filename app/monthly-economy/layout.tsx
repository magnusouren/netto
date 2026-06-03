import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Månedlig økonomi',
    description:
        'Månedlig kontantstrøm over tid — inntekter, utgifter, lån og balanse — med justerbar lønnsvekst og startdato.',
};

export default function MonthlyEconomyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
