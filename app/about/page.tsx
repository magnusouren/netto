import type { Metadata } from 'next';
import Link from 'next/link';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyH2 } from '@/components/typography/typographyH2';
import { TypographyP } from '@/components/typography/typographyP';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
    title: 'Om',
    description:
        'Om Netto, et nettbasert verktøy for personlig økonomi og boligkjøp, bygget for norske forhold.',
};

export default function AboutPage() {
    return (
        <div className='w-full py-10 space-y-12'>
            <section className='space-y-6'>
                <TypographyH1>Om Netto</TypographyH1>
                <TypographyP>
                    Netto er et nettbasert verktøy som hjelper deg å få full
                    oversikt over månedlig økonomi, skatt, lån og boligkjøp.
                    Det er bygget for norske forhold med oppdaterte skatteregler
                    og satser, slik at tallene du ser stemmer med din egen
                    hverdag.
                </TypographyP>
            </section>

            <section className='space-y-4'>
                <TypographyH2>Personvern</TypographyH2>
                <TypographyP>
                    Alle data du legger inn lagres lokalt i nettleseren din.
                    Ingen tall sendes til en server, og ingen kontoer eller
                    pålogginger er nødvendig. Du eier dine egne data, og kan
                    dele dem via en lenke når du selv ønsker det.
                </TypographyP>
            </section>

            <section className='space-y-4'>
                <TypographyH2>Hva du kan gjøre</TypographyH2>
                <ul className='list-disc pl-6 space-y-2 text-foreground/80'>
                    <li>Beregne skatt og månedlig nettoinntekt</li>
                    <li>Lage nedbetalingsplaner for lån</li>
                    <li>Følge utviklingen av egenkapital over tid</li>
                    <li>Sammenligne flere boliger side om side</li>
                    <li>Planlegge bud og se hvordan rentenivå påvirker økonomien</li>
                </ul>
            </section>

            <section className='space-y-4'>
                <TypographyH2>Bak prosjektet</TypographyH2>
                <TypographyP>
                    Netto er laget av{' '}
                    <a
                        href='https://www.magnus.ouren.no'
                        target='_blank'
                        rel='noopener noreferrer'
                        className='underline hover:text-foreground'
                    >
                        Magnus Ouren
                    </a>
                    . Verktøyet er et personlig prosjekt og brukes på eget
                    ansvar. Det erstatter ikke profesjonell økonomisk
                    rådgivning.
                </TypographyP>
                <div className='pt-2'>
                    <Button asChild>
                        <Link href='/data'>Kom i gang</Link>
                    </Button>
                </div>
            </section>
        </div>
    );
}
