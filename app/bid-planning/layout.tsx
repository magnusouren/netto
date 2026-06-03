import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Budplanlegging',
    description:
        'Sammenlign hvordan ulike bud påvirker månedsbudsjettet. Se utslaget på lånebeløp, renter og kontantstrøm i sanntid.',
};

export default function BidPlanningLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
