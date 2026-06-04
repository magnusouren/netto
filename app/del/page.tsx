'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Check, Copy, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyP } from '@/components/typography/typographyP';
import { Glance } from '@/components/ledger/Glance';
import useStore, { StoreState } from '@/lib/store';
import {
    decodeShareData,
    isDataEmpty,
    readSharePayloadFromHash,
} from '@/lib/share';
import type { EconomyData } from '@/types';

type Status =
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'auto-imported' }
    | { kind: 'confirm'; incoming: EconomyData };

function summarize(data: EconomyData) {
    return {
        incomes: data.incomes.length,
        loans: data.loans.length,
        houses: data.houses.length,
        livingCosts: data.livingCosts.length,
        fixedExpenses: data.personalFixedExpenses.length,
        equity: data.personalEquity,
    };
}

export default function DelPage() {
    const router = useRouter();
    const hasHydrated = useStore((s: StoreState) => s._hasHydrated);
    const data = useStore((s: StoreState) => s.data);
    const setData = useStore((s: StoreState) => s.setData);

    const [status, setStatus] = useState<Status>({ kind: 'loading' });
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState<string>('');

    useEffect(() => {
        if (!hasHydrated) return;
        if (typeof window === 'undefined') return;

        const payload = readSharePayloadFromHash(window.location.hash);
        setShareUrl(window.location.href);

        if (!payload) {
            setStatus({
                kind: 'error',
                message: 'Ingen delingsdata i lenken.',
            });
            return;
        }

        const incoming = decodeShareData(payload);
        if (!incoming) {
            setStatus({
                kind: 'error',
                message: 'Lenken er ugyldig eller skadet.',
            });
            return;
        }

        if (isDataEmpty(data)) {
            setData(incoming);
            setStatus({ kind: 'auto-imported' });
            const t = setTimeout(() => router.replace('/summary'), 600);
            return () => clearTimeout(t);
        }

        setStatus({ kind: 'confirm', incoming });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasHydrated]);

    const currentSummary = useMemo(() => summarize(data), [data]);
    const incomingSummary = useMemo(
        () =>
            status.kind === 'confirm' ? summarize(status.incoming) : null,
        [status]
    );

    const handleReplace = () => {
        if (status.kind !== 'confirm') return;
        setData(status.incoming);
        router.replace('/summary');
    };

    const handleCopy = async () => {
        if (!shareUrl) return;
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // ignore — older browsers without clipboard API
        }
    };

    return (
        <div className='w-full py-10 space-y-8'>
            <header className='space-y-3'>
                <TypographyH1>Delt data</TypographyH1>
                <TypographyP>
                    Noen har delt en lenke med deg som inneholder
                    økonomidata. Du kan importere den til din egen Netto-økt.
                </TypographyP>
            </header>

            {status.kind === 'loading' && (
                <div className='text-sm text-muted-foreground'>
                    Leser delt data …
                </div>
            )}

            {status.kind === 'error' && (
                <Glance
                    title='Kunne ikke importere'
                    subtitle={status.message}
                    indexLabel={<AlertTriangle className='h-3 w-3' />}
                >
                    <div className='py-3 space-y-3'>
                        <TypographyP>
                            Be avsenderen om å generere en ny delingslenke,
                            eller fortsett med dine eksisterende data.
                        </TypographyP>
                        <div className='flex gap-2'>
                            <Button asChild variant='outline'>
                                <Link href='/'>Til forsiden</Link>
                            </Button>
                            <Button asChild>
                                <Link href='/data'>Til mine data</Link>
                            </Button>
                        </div>
                    </div>
                </Glance>
            )}

            {status.kind === 'auto-imported' && (
                <Glance
                    title='Data importert'
                    subtitle='Sender deg videre til oppsummeringen …'
                    indexLabel={<Check className='h-3 w-3' />}
                >
                    <div className='py-3'>
                        <Button asChild>
                            <Link href='/summary'>Gå til oppsummering</Link>
                        </Button>
                    </div>
                </Glance>
            )}

            {status.kind === 'confirm' && incomingSummary && (
                <div className='space-y-6'>
                    <Glance
                        title='Du har allerede lagrede data'
                        subtitle='Velg hva du vil gjøre med den delte dataen'
                        indexLabel={<AlertTriangle className='h-3 w-3' />}
                    >
                        <div className='py-3 grid gap-4 sm:grid-cols-2'>
                            <div className='space-y-1 rounded-md border p-3'>
                                <div className='text-xs uppercase tracking-wide text-muted-foreground'>
                                    Dine nåværende data
                                </div>
                                <SummaryList summary={currentSummary} />
                            </div>
                            <div className='space-y-1 rounded-md border p-3 border-brandOrange/60 bg-brandOrange/5'>
                                <div className='text-xs uppercase tracking-wide text-brandBlue font-medium'>
                                    Delt data (innkommende)
                                </div>
                                <SummaryList summary={incomingSummary} />
                            </div>
                        </div>
                        <div className='flex flex-wrap gap-3 pt-2'>
                            <Button
                                variant='destructive'
                                onClick={handleReplace}
                            >
                                Erstatt mine data
                            </Button>
                            <Button
                                variant='outline'
                                onClick={() => router.push('/')}
                            >
                                Avbryt
                            </Button>
                        </div>
                    </Glance>

                    <Glance
                        title='Vil du beholde begge?'
                        subtitle='Åpne lenken i et inkognito-vindu for å se den delte dataen uten å overskrive dine.'
                    >
                        <div className='py-3 flex flex-wrap gap-2'>
                            <Button
                                variant='outline'
                                onClick={handleCopy}
                                disabled={!shareUrl}
                            >
                                {copied ? (
                                    <>
                                        <Check className='h-4 w-4' />
                                        Lenke kopiert
                                    </>
                                ) : (
                                    <>
                                        <Copy className='h-4 w-4' />
                                        Kopier lenken
                                    </>
                                )}
                            </Button>
                        </div>
                    </Glance>
                </div>
            )}

            <p className='flex items-center gap-2 text-xs text-muted-foreground pt-4 border-t'>
                <ShieldCheck className='h-3.5 w-3.5' />
                Data deles via URL-fragmentet og sendes aldri til serveren.
            </p>
        </div>
    );
}

function SummaryList({
    summary,
}: {
    summary: ReturnType<typeof summarize>;
}) {
    const rows: [string, string | number][] = [
        ['Inntekter', summary.incomes],
        ['Lån', summary.loans],
        ['Boliger', summary.houses],
        ['Levekostnader', summary.livingCosts],
        ['Faste utgifter', summary.fixedExpenses],
        ['Egenkapital', summary.equity.toLocaleString('nb-NO') + ' kr'],
    ];
    return (
        <ul className='text-sm space-y-1 mt-1'>
            {rows.map(([label, value]) => (
                <li key={label} className='flex justify-between'>
                    <span className='text-muted-foreground'>{label}</span>
                    <span className='font-medium tabular-nums'>{value}</span>
                </li>
            ))}
        </ul>
    );
}
