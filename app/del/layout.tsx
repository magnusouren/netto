import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Delt data',
    description: 'Importer delt økonomidata fra en lenke.',
    robots: {
        index: false,
        follow: false,
    },
};

export default function DelLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
