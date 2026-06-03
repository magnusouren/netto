import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Boliger',
    description:
        'Legg til og sammenlign boligalternativer. Velg en aktiv bolig for å bruke den i beregninger av lån, kostnader og egenkapital.',
};

export default function HousesLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
