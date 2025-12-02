'use client';

import { TypographyH2 } from '@/components/typography/typographyH2';
import useStore, { StoreState } from '@/lib/store';

export default function Home() {
    const data = useStore((s: StoreState) => s.data);

    return (
        <>
            <div className='w-full h-16 mt-8 relative text-left'>
                <h1 className='text-4xl md:text-5xl font-bold mb-4 text-brandBlue'>
                    Statistikk og analyser for din bolig
                </h1>
            </div>

            <section className='mt-8'>TODO</section>
        </>
    );
}
