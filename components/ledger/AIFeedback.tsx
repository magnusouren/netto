'use client';

import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { Button } from '@/components/ui/button';
import { LabelMono } from './LabelMono';
import type {
    AIFeedbackRequest,
    AIFeedbackResponse,
} from '@/app/api/ai-feedback/route';

type Props = {
    payload: AIFeedbackRequest;
};

export function AIFeedback({ payload }: Props) {
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const requestFeedback = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ai-feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const json = (await res.json()) as Partial<AIFeedbackResponse> & {
                error?: string;
            };
            if (!res.ok || !json.feedback) {
                throw new Error(json.error || 'Ukjent feil');
            }
            setFeedback(json.feedback);
        } catch (err) {
            const message =
                err instanceof Error
                    ? err.message
                    : 'Kunne ikke hente AI-tilbakemelding.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className='my-8'>
            <div className='flex items-center justify-between gap-3 flex-wrap'>
                <div>
                    <LabelMono className='text-[10px]'>AI-vurdering</LabelMono>
                    <p className='text-sm text-muted-foreground mt-1'>
                        Få en kort tolkning av månedsregnskapet ditt.
                    </p>
                </div>
                <Button
                    onClick={requestFeedback}
                    disabled={loading}
                    variant='outline'
                    size='sm'
                >
                    {loading ? (
                        <Loader2 className='h-4 w-4 animate-spin' />
                    ) : (
                        <Sparkles className='h-4 w-4' />
                    )}
                    {feedback ? 'Hent ny vurdering' : 'Be om AI-vurdering'}
                </Button>
            </div>

            {error && (
                <div className='mt-4 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
                    {error}
                </div>
            )}

            {feedback && !error && (
                <div
                    className='mt-4 rounded-md border border-border bg-card px-5 py-4 text-sm leading-relaxed text-foreground/90
                        [&_h1]:font-serif [&_h1]:text-xl [&_h1]:mt-2 [&_h1]:mb-2
                        [&_h2]:font-serif [&_h2]:text-lg [&_h2]:mt-3 [&_h2]:mb-1.5
                        [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-3 [&_h3]:mb-1
                        [&_p]:my-2 first:[&_p]:mt-0 last:[&_p]:mb-0
                        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                        [&_li]:my-0.5
                        [&_strong]:font-semibold [&_strong]:text-foreground
                        [&_em]:italic
                        [&_code]:font-mono [&_code]:text-[12.5px] [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded'
                >
                    <ReactMarkdown>{feedback}</ReactMarkdown>
                </div>
            )}
        </section>
    );
}
