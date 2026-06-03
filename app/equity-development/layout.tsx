import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Egenkapitalutvikling',
    description:
        'Følg utviklingen i egenkapital over tid basert på avdrag på boliglån og antatt prisvekst.',
};

export default function EquityDevelopmentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
