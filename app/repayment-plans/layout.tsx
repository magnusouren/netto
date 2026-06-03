import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Nedbetalingsplaner',
    description:
        'Nedbetalingsplaner for boliglån og andre lån — termin for termin, med renter, avdrag og gjenværende balanse.',
};

export default function RepaymentPlansLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
