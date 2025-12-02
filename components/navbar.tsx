'use client';

import React from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Navbar() {
    return (
        <header className='sticky top-0 z-40 bg-white/75 backdrop-blur-md border-b border-muted/20'>
            <div className='max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'>
                <div className='flex items-center justify-between h-16'>
                    <div className='flex items-center gap-3'>
                        <div className='text-lg sm:text-2xl font-semibold text-brandBlue'>
                            <Link href='/'>NETTO</Link>
                        </div>
                    </div>

                    {/* <div className='flex items-center gap-3'>
                        <Button
                            variant='ghost'
                            size='sm'
                            className='hidden md:inline-flex text-muted-foreground'
                            disabled
                        >
                            Innstillinger
                        </Button>

                        <div className='w-9 h-9 rounded-full bg-muted/10 flex items-center justify-center'>
                            <User className='w-5 h-5 text-muted-foreground' />
                        </div>
                    </div> */}
                </div>
            </div>
        </header>
    );
}
