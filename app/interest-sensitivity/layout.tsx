import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Rentefølsomhet',
    description:
        'Se hvordan endringer i rentenivået påvirker terminbeløp, skattefradrag og disponibelt beløp per måned.',
};

export default function InterestSensitivityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
