'use client';

import { TypographyH1 } from '@/components/typography/typographyH1';
import { TypographyP } from '@/components/typography/typographyP';
import useStore, { StoreState } from '@/lib/store';

export default function Loans() {
    const data = useStore((s: StoreState) => s.data);

    return (
        <>
            <div className='container my-8 min-h-24'>
                <TypographyH1>Oppsummering</TypographyH1>
                <TypographyP>TODO</TypographyP>
            </div>
        </>
    );
}
