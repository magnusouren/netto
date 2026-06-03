import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyP } from '@/components/typography/typographyP';
import Summary from '@/views/summary';

export const metadata: Metadata = {
    title: 'Oppsummering',
    description:
        'Månedsregnskapet ditt på ett blikk — netto inn, faste utgifter ut, og hva som er igjen til sparing og forbruk.',
};

export default function SummaryPage() {
    return (
        <main className='container my-8 min-h-24'>
            <TypographyH1>Oppsummering</TypographyH1>
            <TypographyP>
                Månedsregnskapet ditt totalt sett. Mer detaljerte oversikter finner du ved å følge lenken nederst på siden.
            </TypographyP>

            <Summary />

            <div className='mt-6 flex justify-end'>
                <Link
                    href='/summary/details'
                    className='inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors'
                >
                    Se detaljert oversikt <ArrowRight className='h-3.5 w-3.5' />
                </Link>
            </div>
        </main>
    );
}
