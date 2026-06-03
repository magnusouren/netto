import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Detaljert oversikt',
    description:
        'Full oversikt over inntekter, skatt, lån, boligkostnader og egenkapital — med nedbrytning per kilde og fremtidsprognoser.',
};

export default function SummaryDetailsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
