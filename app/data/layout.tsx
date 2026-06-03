import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Inntekter og utgifter',
    description:
        'Legg inn inntekter, faste utgifter, lån og bolig. Alt lagres lokalt i nettleseren og brukes i beregningene på de andre sidene.',
};

export default function DataLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
