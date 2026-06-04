import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Sammenligning',
    description:
        'Sammenlign boliger side ved side på pris, månedlige kostnader, skatt og forventet egenkapital.',
};

export default function SammenligningLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
