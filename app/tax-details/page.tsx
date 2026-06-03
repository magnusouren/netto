import type { Metadata } from 'next';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyP } from '@/components/typography/typographyP';
import Taxes from '@/views/taxes';

export const metadata: Metadata = {
    title: 'Skattedetaljer',
    description:
        'Detaljert skatteberegning basert på inntekter, fradrag og renter. Se alminnelig skatt, trygdeavgift, trinnskatt og effektiv skattesats.',
};

export default function Loans() {
    return (
        <>
            <div className='container my-8 min-h-24'>
                <TypographyH1>Skattedetaljer</TypographyH1>
                <TypographyP>
                    Her finner du en detaljert oversikt over skatteberegningen
                    basert på din inntekt, fradrag og andre relevante faktorer.
                    Tabellen viser hvordan skatten din er fordelt på ulike
                    komponenter, inkludert trygdeavgift, trinnskatt og
                    personfradrag. Netto månedsinntekt etter skatt er beregnet som gjennomsnittlig månedlig inntekt og avvik vil derfor kunne forekomme i enkelte måneder.
                </TypographyP>
            </div>

            <section className='container'>
                <Taxes />
            </section>
        </>
    );
}
